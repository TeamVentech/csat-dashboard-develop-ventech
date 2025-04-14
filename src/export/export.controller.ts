import { Controller, Post, Body, Get, Param, Res, HttpStatus, Query, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import * as fs from 'fs';

@Controller('export')
export class ExportController {
  private readonly logger = new Logger(ExportController.name);
  
  constructor(private readonly exportService: ExportService) {}

  /**
   * Export data from an Elasticsearch index to CSV
   * @param body Contains index name, query, fileName, and optional fields mapping
   * @returns Information about the exported file
   */
  @Post('elasticsearch-to-csv')
  async exportElasticsearchToCsv(
    @Body() body: { 
      index: string; 
      query: any; 
      fileName: string;
      fields?: Record<string, string>;
    },
  ) {
    const { index, query, fileName, fields } = body;
    
    // Validate required parameters
    if (!index) {
      throw new HttpException('Index name is required', HttpStatus.BAD_REQUEST);
    }
    
    if (!fileName) {
      throw new HttpException('File name is required', HttpStatus.BAD_REQUEST);
    }
    
    try {
      this.logger.log(`Starting export from index ${index} to CSV file ${fileName}`);
      
      if (fields) {
        this.logger.log(`With custom field mapping: ${JSON.stringify(fields)}`);
      }
      
      const result = await this.exportService.exportToCsv(
        index, 
        query || { query: { match_all: {} } }, 
        fileName,
        fields
      );
      
      this.logger.log(`Successfully exported ${result.totalRecords} records to ${fileName}.csv`);
      
      return {
        success: true,
        message: `Successfully exported ${result.totalRecords} records to CSV`,
        fileName: `${fileName}.csv`,
        totalRecords: result.totalRecords,
      };
    } catch (error) {
      this.logger.error(`Failed to export data: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Failed to export data',
        error: error.message,
      };
    }
  }

  /**
   * Download a previously exported CSV file
   * @param fileName Name of the file to download
   * @param res Express response object
   */
  @Get('download/:fileName')
  async downloadCsv(@Param('fileName') fileName: string, @Res() res: Response) {
    if (!fileName) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'File name is required',
      });
    }
    
    try {
      const filePath = `${process.cwd()}/exports/${fileName}`;
      
      if (!fs.existsSync(filePath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'File not found',
        });
      }
      
      // Create readable stream from file
      const fileStream = this.exportService.createFileReadStream(filePath);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      // Pipe file to response
      fileStream.pipe(res);
      
      // Handle errors
      fileStream.on('error', (error) => {
        this.logger.error(`Error streaming file: ${error.message}`, error.stack);
        if (!res.headersSent) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error streaming file',
            error: error.message,
          });
        }
      });
    } catch (error) {
      this.logger.error(`Error downloading file: ${error.message}`, error.stack);
      
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'File could not be accessed',
        error: error.message,
      });
    }
  }

  /**
   * Direct data export and download endpoint with streaming
   * @param query Query parameters containing index, query (stringified JSON), filename, and optional fields (stringified JSON mapping)
   * @param res Express response object
   */
  @Get('stream')
  async streamExport(
    @Query('index') index: string,
    @Query('query') queryStr: string,
    @Query('fileName') fileName: string,
    @Query('fields') fieldsStr: string,
    @Res() res: Response,
  ) {
    // Validate required parameters
    if (!index) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Index name is required',
      });
    }
    
    if (!fileName) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'File name is required',
      });
    }
    
    try {
      let query;
      
      // Parse the query string if provided, otherwise use match_all
      if (queryStr) {
        try {
          query = JSON.parse(queryStr);
        } catch (e) {
          return res.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Invalid query format. Must be valid JSON.',
            error: e.message,
          });
        }
      } else {
        query = { query: { match_all: {} } };
      }
      
      // Parse fields mapping if provided
      let fields: Record<string, string> | undefined;
      if (fieldsStr) {
        try {
          fields = JSON.parse(fieldsStr);
        } catch (e) {
          return res.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: 'Invalid fields format. Must be valid JSON mapping.',
            error: e.message,
          });
        }
      }
      
      this.logger.log(`Starting streaming export from index ${index} to CSV file ${fileName}`);
      
      if (fields) {
        this.logger.log(`With custom field mapping: ${JSON.stringify(fields)}`);
      }
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}.csv`);
      
      // Generate CSV file
      const result = await this.exportService.exportToCsv(index, query, fileName, fields);
      
      this.logger.log(`Generated CSV with ${result.totalRecords} records, streaming to client`);
      
      // Stream the file to the response
      const fileStream = this.exportService.createFileReadStream(result.filePath);
      
      // Handle streaming errors
      fileStream.on('error', (error) => {
        this.logger.error(`Error streaming file: ${error.message}`, error.stack);
        if (!res.headersSent) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error streaming file',
            error: error.message,
          });
        }
      });
      
      fileStream.pipe(res);
      
      // Delete the file after streaming (optional - can be configured based on needs)
      fileStream.on('end', () => {
        setTimeout(() => {
          try {
            fs.unlinkSync(result.filePath);
            this.logger.log(`Temporary file ${result.filePath} deleted after streaming`);
          } catch (err) {
            this.logger.error(`Error deleting temporary file: ${err.message}`, err.stack);
          }
        }, 1000);
      });
    } catch (error) {
      this.logger.error(`Failed to export data: ${error.message}`, error.stack);
      
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Failed to export data',
        error: error.message,
      });
    }
  }
} 