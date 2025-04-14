import { Injectable, Logger } from '@nestjs/common';
import { ElasticService } from '../ElasticSearch/elasticsearch.service';
import { createReadStream, createWriteStream } from 'fs';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { stringify } from 'csv-stringify';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  
  constructor(
    private readonly elasticService: ElasticService
  ) {}

  /**
   * Export data from Elasticsearch to CSV using Scroll API for handling large datasets
   * @param index Elasticsearch index to query
   * @param query Elasticsearch query
   * @param fileName Output file name
   * @param fields Optional field mapping {csvHeaderName: 'path.to.field'}
   * @returns Object with file path and info about the export
   */
  async exportToCsv(
    index: string, 
    query: any, 
    fileName: string,
    fields?: Record<string, string>
  ): Promise<{ filePath: string; totalRecords: number }> {
    // Create directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, `${fileName}.csv`);
    const writeStream = createWriteStream(filePath);
    
    // Track total records
    let totalRecords = 0;
    let csvStream;
    let scrollId = null;
    
    try {
      // Initialize scroll with Elasticsearch
      // Set a 1-minute scroll window which will be extended with each request
      const scrollTime = '1m';
      const batchSize = 5000; // Process in larger batches for scroll API
      
      // Get the Elasticsearch service from our elastic service
      const elasticsearchService = this.elasticService.getSearchService();
      
      // Initial search to get the first batch and scroll ID
      const initialResponse = await elasticsearchService.search({
        index,
        scroll: scrollTime,
        size: batchSize,
        body: query || { query: { match_all: {} } }
      });
      
      scrollId = initialResponse.body._scroll_id;
      const hits = initialResponse.body.hits.hits;
      
      if (!hits || hits.length === 0) {
        // No data found, return empty CSV
        csvStream = this.createCsvStream();
        csvStream.pipe(writeStream);
        csvStream.end();
        return { filePath, totalRecords: 0 };
      }
      
      // Extract data from response
      const initialData = hits.map(hit => hit._source);
      
      // Determine headers based on either provided fields or the first record
      let headers: string[];
      let fieldMapping: Record<string, string> = {};
      
      if (fields && Object.keys(fields).length > 0) {
        // Use provided field mapping
        headers = Object.keys(fields);
        fieldMapping = fields;
        this.logger.log(`Using provided field mapping: ${JSON.stringify(fieldMapping)}`);
      } else {
        // Get all field names from the first record for CSV headers
        const firstRecord = initialData[0];
        headers = this.extractHeaders(firstRecord);
        
        // Create a 1:1 mapping for all detected fields
        headers.forEach(header => {
          fieldMapping[header] = header;
        });
        this.logger.log(`Using auto-generated field mapping with ${headers.length} fields`);
      }
      
      // Create CSV stream
      csvStream = this.createCsvStream();
      
      // Handle errors on CSV stream
      csvStream.on('error', (err) => {
        this.logger.error(`Error in CSV stream: ${err.message}`, err.stack);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        // Clean up scroll context if we have a scrollId
        if (scrollId) {
          this.clearScrollContext(scrollId, elasticsearchService)
            .catch(e => this.logger.error(`Failed to clear scroll context: ${e.message}`));
        }
      });
      
      // Handle errors on write stream
      writeStream.on('error', (err) => {
        this.logger.error(`Error in write stream: ${err.message}`, err.stack);
        if (csvStream) {
          csvStream.end();
        }
        // Clean up scroll context if we have a scrollId
        if (scrollId) {
          this.clearScrollContext(scrollId, elasticsearchService)
            .catch(e => this.logger.error(`Failed to clear scroll context: ${e.message}`));
        }
      });
      
      csvStream.pipe(writeStream);
      
      // Process initial batch
      this.processRecordsForCsvWithMapping(initialData, csvStream, headers, fieldMapping);
      totalRecords += initialData.length;
      
      // Log progress for the first batch
      this.logger.log(`Exported initial batch of ${initialData.length} records`);
      
      // Continue scrolling until no more hits
      let hasMoreData = initialData.length === batchSize;
      
      while (hasMoreData && scrollId) {
        // Use the scroll ID to get the next batch
        const scrollResponse = await elasticsearchService.scroll({
          scroll_id: scrollId,
          scroll: scrollTime
        });
        
        // Update scroll ID for next iteration
        scrollId = scrollResponse.body._scroll_id;
        const scrollHits = scrollResponse.body.hits.hits;
        
        if (!scrollHits || scrollHits.length === 0) {
          hasMoreData = false;
          break;
        }
        
        // Extract data from response
        const scrollData = scrollHits.map(hit => hit._source);
        
        // Process batch
        this.processRecordsForCsvWithMapping(scrollData, csvStream, headers, fieldMapping);
        totalRecords += scrollData.length;
        
        // Log progress every 50,000 records
        if (totalRecords % 50000 === 0) {
          this.logger.log(`Exported ${totalRecords} records so far...`);
        }
        
        // Check if we've reached the end
        hasMoreData = scrollHits.length === batchSize;
      }
      
      // Close the CSV stream
      csvStream.end();
      
      // Wait for the write stream to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });
      
      // Clean up scroll context
      if (scrollId) {
        await this.clearScrollContext(scrollId, elasticsearchService);
      }
      
      this.logger.log(`Export completed. Total records: ${totalRecords}`);
      return { filePath, totalRecords };
    } catch (error) {
      // Clean up file if there was an error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Clean up scroll context if we have a scrollId
      if (scrollId) {
        const elasticsearchService = this.elasticService.getSearchService();
        this.clearScrollContext(scrollId, elasticsearchService)
          .catch(e => this.logger.error(`Failed to clear scroll context: ${e.message}`));
      }
      
      this.logger.error(`Error exporting to CSV: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Clear Elasticsearch scroll context to free resources
   * @param scrollId Scroll ID to clear
   * @param elasticsearchService The Elasticsearch service instance
   */
  private async clearScrollContext(scrollId: string, elasticsearchService: any): Promise<void> {
    try {
      await elasticsearchService.clearScroll({
        scroll_id: scrollId
      });
      this.logger.log('Scroll context cleared successfully');
    } catch (error) {
      this.logger.error(`Error clearing scroll context: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Create a streaming response for a CSV file
   * @param filePath Path to the CSV file
   * @returns Readable stream
   */
  createFileReadStream(filePath: string): Readable {
    return createReadStream(filePath);
  }
  
  /**
   * Create a CSV formatting stream
   * @returns CSV stream that can be piped to a writable stream
   * 
   * Uses the csv-stringify package to create a transform stream
   * that converts objects to CSV format.
   * 
   * Example usage:
   * ```
   * const csvStream = this.createCsvStream();
   * csvStream.pipe(writeStream);
   * csvStream.write({ field1: 'value1', field2: 'value2' });
   * csvStream.end();
   * ```
   */
  private createCsvStream() {
    try {
      return stringify({ header: true });
    } catch (error) {
      this.logger.error(`Error creating CSV stream: ${error.message}`, error.stack);
      throw new Error(`Failed to create CSV stream: ${error.message}`);
    }
  }
  
  /**
   * Extract all headers recursively from an object
   * @param obj The object to extract headers from
   * @param parentKey Parent key for nested objects
   * @returns Array of header strings
   */
  private extractHeaders(obj: any, parentKey: string = ''): string[] {
    let headers: string[] = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = parentKey ? `${parentKey}.${key}` : key;
        
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          // Recursively extract headers from nested objects
          headers = [...headers, ...this.extractHeaders(value, newKey)];
        } else {
          headers.push(newKey);
        }
      }
    }
    
    return headers;
  }
  
  /**
   * Process records for CSV output with custom field mapping
   * @param records Array of Elasticsearch records
   * @param csvStream The CSV output stream
   * @param headers Array of header fields (CSV column names)
   * @param fieldMapping Mapping of {csvHeaderName: 'path.to.elasticsearch.field'}
   */
  private processRecordsForCsvWithMapping(
    records: any[],
    csvStream: any,
    headers: string[],
    fieldMapping: Record<string, string>
  ): void {
    for (const record of records) {
      const flattenedRecord: Record<string, any> = {};
      
      // Map each field according to the field mapping
      for (const header of headers) {
        const path = fieldMapping[header];
        const keys = path.split('.');
        let value = record;
        
        // Navigate the nested structure
        for (const key of keys) {
          if (value === null || value === undefined) {
            value = '';
            break;
          }
          value = value[key];
        }
        
        // Convert arrays and objects to strings
        if (value !== null && typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        flattenedRecord[header] = value !== undefined ? value : '';
      }
      
      csvStream.write(flattenedRecord);
    }
  }
} 