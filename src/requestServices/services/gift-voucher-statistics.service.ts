import { Injectable } from '@nestjs/common';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
import { GiftVoucherChartDto, TypeOfSaleEnum, PeriodType } from '../dto/gift-voucher-chart.dto';
import { GiftVoucherCorporateSpendersDto } from '../dto/gift-voucher-corporate-spenders.dto';
import { GiftVoucherOccasionsDto } from '../dto/gift-voucher-occasions.dto';
import { GiftVoucherPaymentMethodsDto, PeriodType as PaymentMethodPeriodType } from '../dto/gift-voucher-payment-methods.dto';
import { GiftVoucherExtensionsDto, PeriodType as ExtensionPeriodType } from '../dto/gift-voucher-extensions.dto';

@Injectable()
export class GiftVoucherStatisticsService {
  // Add a cache with 5-minute TTL
  private cache = new Map<string, { data: any, timestamp: number, totalValue: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly elasticSearchService: ElasticService) {}

  async getVoucherSalesByDenomination(filters: GiftVoucherChartDto) {
    try {
      // Create cache key from filters
      const cacheKey = JSON.stringify(filters);
      
      // Check cache
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult && (Date.now() - cachedResult.timestamp) < this.CACHE_TTL) {
        return {
          success: true,
          data: {
            voucherSalesByDenomination: cachedResult.data,
            totalSalesValue: cachedResult.totalValue
          }
        };
      }

      // Build the query for filtering
      const query: any = {
        bool: {
          must: [
            { match: { name: 'Gift Voucher Sales' } }
          ],
          filter: []
        }
      };

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { 'createdAt': {} } };
        if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        query.bool.filter.push(dateRange);
      }

      // Add type of sale filter if provided
      if (filters.typeOfSale) {
        query.bool.filter.push({
          match: { 'type.keyword': filters.typeOfSale }
        });
      }

      // Add occasion filter if provided
      if (filters.occasion) {
        query.bool.filter.push({
          match: { 'metadata.reason_purchase': filters.occasion }
        });
      }

      // Add payment method filter if provided
      if (filters.paymentMethod) {
        query.bool.filter.push({
          match: { 'metadata.payment_method': filters.paymentMethod }
        });
      }

      // Add individual-specific filters if type of sale is Individual
      if (filters.typeOfSale === TypeOfSaleEnum.INDIVIDUAL) {
        // Add age filter if provided
        if (filters.age) {
          query.bool.filter.push({
            match: { 'metadata.customer.age': filters.age.toString() }
          });
        }

        // Add gender filter if provided
        if (filters.gender) {
          query.bool.filter.push({
            match: { 'metadata.customer.gender': filters.gender }
          });
        }
      }

      // Add denomination filter directly to the main query if provided
      if (filters.denomination) {
        query.bool.filter.push({
          term: { 'metadata.voucher.denominations': filters.denomination }
        });
      }

      // Define aggregations based on period type
      const dateHistogramInterval = this.getIntervalForPeriod(filters.period);
      const dateHistogramFormat = this.getFormatForPeriod(filters.period);

      // Execute search to get total value and time-based aggregations
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 0, // No need to return documents
          aggs: {
            // Sum total value
            total_value: {
              sum: {
                field: 'metadata.value'
              }
            },
            // Group by time period
            by_period: {
              date_histogram: {
                field: 'createdAt',
                calendar_interval: dateHistogramInterval,
                format: dateHistogramFormat,
                min_doc_count: 0 // Include empty buckets
              }
            }
          }
        }
      });

      // Get total value from aggregation
      const totalValue = result.body.aggregations.total_value.value || 0;

      // Fetch all matching documents since we can't use nested aggregations
      const documentsResult = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 1000, // Limit to 1000 documents
          _source: ['createdAt', 'metadata.voucher', 'metadata.value']
        }
      });

      const hits = documentsResult.body.hits.hits.map((hit: any) => hit._source);
      
      // Process results
      const formattedData = this.processVoucherSalesData(
        hits,
        result.body.aggregations.by_period.buckets,
        filters.period
      );

      // Cache the results
      this.cache.set(cacheKey, { 
        data: formattedData, 
        timestamp: Date.now(),
        totalValue 
      });
      
      return {
        success: true,
        data: {
          voucherSalesByDenomination: formattedData,
          totalSalesValue: totalValue
        }
      };
    } catch (error) {
      console.error('Error generating gift voucher sales chart data:', error);
      return {
        success: false,
        message: 'Error generating gift voucher sales chart data',
        error: error.message || error
      };
    }
  }

  async getCorporateHighestSpenders(filters: GiftVoucherCorporateSpendersDto) {
    try {
      // Create cache key from filters
      const cacheKey = 'corporate_spenders_' + JSON.stringify(filters);
      
      // Check cache
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult && (Date.now() - cachedResult.timestamp) < this.CACHE_TTL) {
        return {
          success: true,
          data: {
            corporateSpenders: cachedResult.data,
            totalValue: cachedResult.totalValue
          }
        };
      }

      // Build the query for filtering corporate sales
      const query: any = {
        bool: {
          must: [
            { match: { name: 'Gift Voucher Sales' } },
            { match: { type: 'Corporate Voucher Sale' } }
          ],
          filter: []
        }
      };

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { 'createdAt': {} } };
        if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        query.bool.filter.push(dateRange);
      }

      // Execute search to get all corporate sales
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 1000, // Limit to 1000 documents
          _source: ['metadata.Company', 'metadata.value', 'metadata.voucher']
        }
      });

      const hits = result.body.hits.hits.map((hit: any) => hit._source);
      
      // Process and aggregate by company
      const corporateSpendersData = this.processCorporateSpendersData(hits);
      const totalValue = corporateSpendersData.reduce((sum, item) => sum + parseFloat(item.value), 0);

      // Cache the results
      this.cache.set(cacheKey, { 
        data: corporateSpendersData, 
        timestamp: Date.now(),
        totalValue 
      });
      
      return {
        success: true,
        data: {
          corporateSpenders: corporateSpendersData,
          totalValue: totalValue
        }
      };
    } catch (error) {
      console.error('Error generating corporate spenders data:', error);
      return {
        success: false,
        message: 'Error generating corporate spenders data',
        error: error.message || error
      };
    }
  }

  async getCommonOccasions(filters: GiftVoucherOccasionsDto) {
    try {
      // Create cache key from filters
      const cacheKey = 'occasions_' + JSON.stringify(filters);
      
      // Check cache
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult && (Date.now() - cachedResult.timestamp) < this.CACHE_TTL) {
        return {
          success: true,
          data: {
            occasions: cachedResult.data,
            totalCount: cachedResult.totalValue
          }
        };
      }

      // Build the query for filtering voucher sales
      const query: any = {
        bool: {
          must: [
            { match: { name: 'Gift Voucher Sales' } }
          ],
          filter: []
        }
      };

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { 'createdAt': {} } };
        if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        query.bool.filter.push(dateRange);
      }

      // Execute search with aggregations for occasions
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 0, // No need to return documents, only aggregations
          aggs: {
            // Group by occasion (reason_purchase)
            occasions: {
              terms: {
                field: 'metadata.reason_purchase.keyword',
                size: 100, // Get top 100 occasions
                missing: 'Not Specified' // Handle missing values
              },
              aggs: {
                // For each occasion, count vouchers
                voucher_count: {
                  sum: {
                    script: {
                      source: `
                        int count = 0;
                        if (doc['metadata.voucher'].size() > 0) {
                          for (int i = 0; i < doc['metadata.voucher'].size(); i++) {
                            def voucher = doc['metadata.voucher'][i];
                            if (voucher.containsKey('Vouchers') && voucher['Vouchers'] != null) {
                              count += voucher['Vouchers'];
                            } else {
                              count += 1;
                            }
                          }
                          return count;
                        }
                        return 1;
                      `
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Process aggregation results
      const occasionBuckets = result.body.aggregations.occasions.buckets;
      
      // Format the results
      const occasionsData = occasionBuckets.map(bucket => ({
        occasion: bucket.key,
        count: Math.round(bucket.voucher_count.value).toString(), 
        __typename: "OccasionCount"
      }))
      // Sort by count in descending order
      .sort((a, b) => parseInt(b.count) - parseInt(a.count));
      
      const totalCount = occasionsData.reduce((sum, item) => sum + parseInt(item.count), 0);

      // Cache the results
      this.cache.set(cacheKey, { 
        data: occasionsData, 
        timestamp: Date.now(),
        totalValue: totalCount 
      });
      
      return {
        success: true,
        data: {
          occasions: occasionsData,
          totalCount: totalCount
        }
      };
    } catch (error) {
      // If script fails, fallback to the old method
      if (error.message && error.message.includes('script')) {
        return this.getCommonOccasionsFallback(filters);
      }
      
      console.error('Error generating common occasions data:', error);
      return {
        success: false,
        message: 'Error generating common occasions data',
        error: error.message || error
      };
    }
  }

  // Fallback method using document fetching
  private async getCommonOccasionsFallback(filters: GiftVoucherOccasionsDto) {
    try {
      // Build the query for filtering voucher sales
      const query: any = {
        bool: {
          must: [
            { match: { name: 'Gift Voucher Sales' } }
          ],
          filter: []
        }
      };

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { 'createdAt': {} } };
        if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        query.bool.filter.push(dateRange);
      }

      // Use a simpler aggregation method
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 0,
          aggs: {
            occasions: {
              terms: {
                field: 'metadata.reason_purchase.keyword',
                size: 100,
                missing: 'Not Specified'
              }
            }
          }
        }
      });

      // In parallel, get sample documents to calculate average vouchers per occasion
      const sampleSize = 100;
      const sampleResult = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: sampleSize,
          _source: ['metadata.reason_purchase', 'metadata.voucher']
        }
      });

      const samples = sampleResult.body.hits.hits.map(hit => hit._source);
      
      // Calculate average vouchers per document
      let totalVouchers = 0;
      let countedDocs = 0;
      
      samples.forEach(doc => {
        if (doc.metadata?.voucher && Array.isArray(doc.metadata.voucher)) {
          let docVouchers = 0;
          doc.metadata.voucher.forEach(v => {
            if (v && typeof v.Vouchers === 'number') {
              docVouchers += v.Vouchers;
            }
          });
          if (docVouchers > 0) {
            totalVouchers += docVouchers;
            countedDocs++;
          }
        }
      });
      
      const avgVouchersPerDoc = countedDocs > 0 ? totalVouchers / countedDocs : 1;

      // Process aggregation results
      const occasionBuckets = result.body.aggregations.occasions.buckets;
      
      // Format the results and estimate voucher counts
      const occasionsData = occasionBuckets
        .map(bucket => ({
          occasion: bucket.key,
          count: Math.round(bucket.doc_count * avgVouchersPerDoc).toString(),
          __typename: "OccasionCount"
        }))
        .sort((a, b) => parseInt(b.count) - parseInt(a.count));
      
      const totalCount = occasionsData.reduce((sum, item) => sum + parseInt(item.count), 0);
      
      return {
        success: true,
        data: {
          occasions: occasionsData,
          totalCount: totalCount
        }
      };
    } catch (error) {
      console.error('Error in fallback method for common occasions:', error);
      return {
        success: false,
        message: 'Error generating common occasions data',
        error: error.message || error
      };
    }
  }

  private getIntervalForPeriod(period: string | undefined): string {
    switch (period) {
      case PeriodType.DAILY:
        return 'day';
      case PeriodType.WEEKLY:
        return 'week';
      case PeriodType.MONTHLY:
      default:
        return 'month';
    }
  }

  private getFormatForPeriod(period: string | undefined): string {
    switch (period) {
      case PeriodType.DAILY:
        return 'dd/MM/yyyy';
      case PeriodType.WEEKLY:
        return 'yyyy-MM-dd';
      case PeriodType.MONTHLY:
      default:
        return 'MMMM yyyy';
    }
  }

  private getPeriodKeyForDate(date: Date, periodType: string | undefined): string {
    switch (periodType) {
      case PeriodType.DAILY:
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      case PeriodType.WEEKLY:
        const weekStart = this.getWeekStartDate(date);
        const weekEnd = this.getWeekEndDate(weekStart);
        return `${this.formatDateAsMonthDay(weekStart)} to ${this.formatDateAsMonthDay(weekEnd)}`;
      case PeriodType.MONTHLY:
      default:
        return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    }
  }

  private getWeekStartDate(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sundays
    return new Date(d.setDate(diff));
  }

  private getWeekEndDate(startDate: Date): Date {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 6);
    return d;
  }

  private formatDateAsMonthDay(date: Date): string {
    return `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}`;
  }

  private processVoucherSalesData(
    documents: any[], 
    periodBuckets: any[], 
    periodType: string | undefined
  ): any[] {
    if (!documents || documents.length === 0) {
      return [];
    }

    // Create a map of periods
    const periodMap = new Map();
    
    // Initialize all periods from the buckets
    periodBuckets.forEach(bucket => {
      const period = bucket.key_as_string;
      let formattedPeriod = period;

      // Format period for weekly view
      if (periodType === PeriodType.WEEKLY) {
        const startDate = new Date(bucket.key);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        formattedPeriod = `${this.formatDateAsMonthDay(startDate)} to ${this.formatDateAsMonthDay(endDate)}`;
      }

      periodMap.set(formattedPeriod, new Map());
    });

    // Process documents and aggregate voucher counts by period and denomination
    documents.forEach(doc => {
      if (doc.createdAt && doc.metadata && Array.isArray(doc.metadata.voucher)) {
        const date = new Date(doc.createdAt);
        const periodKey = this.getPeriodKeyForDate(date, periodType);
        
        // Skip if period is not in our map
        if (!periodMap.has(periodKey)) return;
        
        const denominationMap = periodMap.get(periodKey);
        
        // Process each voucher in the document
        doc.metadata.voucher.forEach((voucher: any) => {
          if (!voucher) return;
          
          const denomination = voucher.denominations || 0;
          const count = voucher.Vouchers || 0;
          
          if (!denominationMap.has(denomination)) {
            denominationMap.set(denomination, 0);
          }
          
          denominationMap.set(denomination, denominationMap.get(denomination) + count);
        });
      }
    });

    // Convert map to array in the required format
    const result = [];
    
    periodMap.forEach((denominationMap, periodKey) => {
      denominationMap.forEach((count, denomination) => {
        if (count > 0) {
          result.push({
            period: periodKey,
            denomination: denomination.toString(),
            count: count.toString(),
            __typename: "VoucherSalesByPeriod"
          });
        }
      });
    });
    
    return result;
  }

  private processCorporateSpendersData(documents: any[]): any[] {
    if (!documents || documents.length === 0) {
      return [];
    }

    // Create a map to store data by company
    const corporateMap = new Map();
    
    // Process documents and aggregate values by company
    documents.forEach(doc => {
      if (doc.metadata && doc.metadata.Company && doc.metadata.Company.name && doc.metadata.value) {
        const companyName = doc.metadata.Company.name;
        const companyId = doc.metadata.Company.id || '';
        const value = parseFloat(doc.metadata.value) || 0;
        
        if (!corporateMap.has(companyId)) {
          corporateMap.set(companyId, {
            companyName,
            companyId,
            value: 0,
            count: 0
          });
        }
        
        const company = corporateMap.get(companyId);
        company.value += value;
        
        // Count vouchers
        if (doc.metadata.voucher && Array.isArray(doc.metadata.voucher)) {
          doc.metadata.voucher.forEach((voucher: any) => {
            if (voucher && typeof voucher.Vouchers === 'number') {
              company.count += voucher.Vouchers;
            }
          });
        }
      }
    });

    // Convert map to array and sort by value in descending order
    const result = Array.from(corporateMap.values())
      .sort((a, b) => b.value - a.value)
      .map(company => ({
        companyName: company.companyName,
        companyId: company.companyId,
        value: company.value.toString(),
        count: company.count.toString(),
        __typename: "CorporateSpender"
      }));
    
    return result;
  }

  private processOccasionsData(documents: any[]): any[] {
    if (!documents || documents.length === 0) {
      return [];
    }

    // Create a map to store data by occasion
    const occasionMap = new Map();
    
    // Process documents and aggregate counts by occasion
    documents.forEach(doc => {
      if (doc.metadata && doc.metadata.reason_purchase) {
        // Handle empty or missing reason
        const occasion = doc.metadata.reason_purchase || 'Not Specified';
        
        if (!occasionMap.has(occasion)) {
          occasionMap.set(occasion, {
            occasion,
            count: 0
          });
        }
        
        const occasionData = occasionMap.get(occasion);
        
        // Count vouchers
        if (doc.metadata.voucher && Array.isArray(doc.metadata.voucher)) {
          doc.metadata.voucher.forEach((voucher: any) => {
            if (voucher && typeof voucher.Vouchers === 'number') {
              occasionData.count += voucher.Vouchers;
            }
          });
        } else {
          // If no voucher data, just count the document once
          occasionData.count += 1;
        }
      }
    });

    // Convert map to array and sort by count in descending order
    const result = Array.from(occasionMap.values())
      .sort((a, b) => b.count - a.count)
      .map(item => ({
        occasion: item.occasion,
        count: item.count.toString(),
        __typename: "OccasionCount"
      }));
    
    return result;
  }

  async getRatingStatistics(
    filters: {
        fromDate?: string;
        toDate?: string;
        type?: string;
    }
) {
    try {
        // Build the query for all services
        const query: any = {
            bool: {
                must: [
                    { match: { 'name.keyword': 'Gift Voucher Sales' } }
                ],
                filter: []
            }
        };

        // Add type filter
        // Add date range filter if provided
        if(filters.type){
            query.bool.must.push({ match: { 'type.keyword': filters.type } });
        }

        if (filters.fromDate || filters.toDate) {
            const dateRange: any = { range: { 'createdAt': {} } };
            if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
            if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
            query.bool.filter.push(dateRange);
        }

        // Execute search query
        const result = await this.elasticSearchService.getSearchService().search({
            index: 'services',
            body: {
                query,
                size: 10000 // Get all matching documents
            }
        });

        const hits = result.body.hits.hits.map((hit: any) => hit._source);
        
        // Process rating statistics
        const ratingStats = this.processRatingStatistics(hits);
        
        return {
            success: true,
            data: ratingStats
        };
    } catch (error) {
        console.error('Error generating rating statistics:', error);
        return {
            success: false,
            message: 'Error generating rating statistics',
            error: error.message || error
        };
    }
}

private processRatingStatistics(data: any[]) {
    if (!data || data.length === 0) {
        return [];
    }

    // Define rating labels
    const ratingLabels = {
        '0': 'Not Rated',
        '1': 'Very Bad',
        '2': 'Bad',
        '3': 'Good',
        '4': 'Very Good',
        '5': 'Excellent'
    };
    
    // Initialize counts for each rating
    const ratingCounts = {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0
    };
    
    // Count occurrences of each rating
    data.forEach(item => {
        const rating = String(item.rating || '0');
        if (rating in ratingCounts) {
            ratingCounts[rating]++;
        } else {
            // If rating is not one of the expected values, count as "Not Rated"
            ratingCounts['0']++;
        }
    });
    
    // Convert to array of objects with label, value and count
    const result = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: parseInt(rating),
        label: ratingLabels[rating],
        count
    }));
    
    return result;
}

async getRatingByPeriod(
  filters: {
      fromDate?: string;
      toDate?: string;
      period?: string;
      type?: string;
  }
) {
  try {
      // Build the query for all services
      const query: any = {
          bool: {
              must: [
                  { match: { 'name.keyword': 'Gift Voucher Sales' } }
              ],
              filter: []
          }
      };

      if(filters.type){
        query.bool.must.push({ match: { 'type.keyword': filters.type } });
    } 
      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
          const dateRange: any = { range: { 'createdAt': {} } };
          if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
          if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
          query.bool.filter.push(dateRange);
      }

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
          index: 'services',
          body: {
              query,
              size: 10000 // Get all matching documents
          }
      });

      const hits = result.body.hits.hits.map((hit: any) => hit._source);
      
      // Process rating statistics by period
      const periodType = filters.period || 'Monthly';
      const ratingStats = this.processRatingByPeriod(hits, periodType);
      
      return {
          success: true,
          data: ratingStats
      };
  } catch (error) {
      console.error('Error generating rating statistics by period:', error);
      return {
          success: false,
          message: 'Error generating rating statistics by period',
          error: error.message || error
      };
  }
}

private processRatingByPeriod(data: any[], periodType: string) {
  if (!data || data.length === 0) {
      return {
          periods: [],
          series: [],
          averages: []
      };
  }

  // Define rating labels
  const ratingLabels = {
      '0': 'Not Rated',
      '1': 'Very Bad',
      '2': 'Bad',
      '3': 'Good',
      '4': 'Very Good',
      '5': 'Excellent'
  };
  
  // Extract all available ratings
  const ratings = Object.keys(ratingLabels).map(key => ({
      value: parseInt(key),
      label: ratingLabels[key]
  }));
  
  // Group data by period
  const periodMap = new Map();
  
  data.forEach(item => {
      if (!item.createdAt) return;
      
      const date = new Date(item.createdAt);
      let periodKey;
      
      // Format the period key based on the selected period type
      switch (periodType) {
          case 'Daily':
              periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
              break;
          case 'Weekly':
              // Calculate week number
              const startOfYear = new Date(date.getFullYear(), 0, 1);
              const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
              const weekNumber = Math.ceil(days / 7);
              periodKey = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
              break;
          case 'Monthly':
          default:
              periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
              break;
      }
      
      if (!periodMap.has(periodKey)) {
          // Initialize an object with all ratings set to 0
          const ratingCounts = {};
          for (let i = 0; i <= 5; i++) {
              ratingCounts[i] = 0;
          }
          periodMap.set(periodKey, ratingCounts);
      }
      
      // Increment the count for this rating
      const periodData = periodMap.get(periodKey);
      const rating = parseInt(String(item.rating || '0'));
      periodData[rating]++;
  });
  
  // Convert map to array and sort by period
  const periodData = Array.from(periodMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, ratingsObj]) => {
          const formattedPeriod = this.formatPeriodLabel(period, periodType);
          const ratingsArray = Object.entries(ratingsObj).map(([rating, count]) => ({
              rating: parseInt(rating),
              count: count as number
          }));
          
          return {
              period: formattedPeriod,
              ratings: ratingsArray
          };
      });
  
  // Calculate average rating for each period (excluding 0 values)
  const averages = periodData.map(p => {
      let totalRating = 0;
      let totalCount = 0;
      
      p.ratings.forEach(r => {
          if (r.rating > 0) { // Exclude 0 (Not Rated) values
              totalRating += r.rating * r.count;
              totalCount += r.count;
          }
      });
      
      const average = totalCount > 0 ? (totalRating / totalCount).toFixed(2) : "0";
      
      return {
          period: p.period,
          average
      };
  });
  
  return {
      periods: periodData.map(p => p.period),
      series: ratings.map(rating => {
          return {
              name: rating.label,
              data: periodData.map(p => {
                  const ratingData = p.ratings.find(r => r.rating === rating.value);
                  return ratingData ? ratingData.count : 0;
              })
          };
      }),
      averages
  };
}

private formatPeriodLabel(periodKey: string, periodType: string): string {
  // Parse the period key
  const parts = periodKey.split('-');
  
  switch (periodType) {
      case 'Daily':
          // Format as "Jan 01, 2025"
          const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: '2-digit',
              year: 'numeric'
          });
      case 'Weekly':
          // Format as date range "03 April - 10 April"
          const year = parseInt(parts[0]);
          const weekNum = parseInt(parts[1].substring(1)); // Remove the 'W'
          
          // Calculate the first day of the year
          const firstDayOfYear = new Date(year, 0, 1);
          
          // Calculate first day of the week (Monday of the week)
          // Get day of the week of January 1st (0 for Sunday, 1 for Monday, etc.)
          const dayOfWeek = firstDayOfYear.getDay();
          const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // If Sunday, add 1, otherwise 8 - day number
          
          // Calculate the first day of week 1
          const firstDayOfWeek1 = new Date(year, 0, daysToAdd);
          
          // Calculate the Monday of the specified week
          const mondayOfWeek = new Date(firstDayOfWeek1);
          mondayOfWeek.setDate(firstDayOfWeek1.getDate() + (weekNum - 1) * 7);
          
          // Calculate the Sunday of the specified week (6 days after Monday)
          const sundayOfWeek = new Date(mondayOfWeek);
          sundayOfWeek.setDate(mondayOfWeek.getDate() + 6);
          
          // Format the dates
          const startDay = mondayOfWeek.getDate().toString().padStart(2, '0');
          const startMonth = mondayOfWeek.toLocaleString('en-US', { month: 'long' });
          
          const endDay = sundayOfWeek.getDate().toString().padStart(2, '0');
          const endMonth = sundayOfWeek.toLocaleString('en-US', { month: 'long' });
          
          // If same month, only show month once
          if (startMonth === endMonth) {
              return `${startDay} - ${endDay} ${startMonth}`;
          } else {
              return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
          }
      case 'Monthly':
      default:
          // Format as "Jan 2025"
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${monthNames[parseInt(parts[1]) - 1]} ${parts[0]}`;
  }
}

async getPaymentMethodStatistics(filters: GiftVoucherPaymentMethodsDto) {
  try {
    // Create cache key from filters
    const cacheKey = 'payment_methods_' + JSON.stringify(filters);
    
    // Check cache
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < this.CACHE_TTL) {
      return {
        success: true,
        data: cachedResult.data
      };
    }

    // Build the query for filtering voucher sales
    const query: any = {
      bool: {
        must: [
          { match: { name: 'Gift Voucher Sales' } }
        ],
        filter: []
      }
    };

    // Add date range filter if provided
    if (filters.fromDate || filters.toDate) {
      const dateRange: any = { range: { 'createdAt': {} } };
      if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
      if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
      query.bool.filter.push(dateRange);
    }

    // Define period interval for time aggregation
    const periodType = filters.period || PaymentMethodPeriodType.MONTHLY;
    const dateHistogramInterval = this.getIntervalForPeriod(periodType);
    const dateHistogramFormat = this.getFormatForPeriod(periodType);

    // Execute search with aggregations for payment methods
    const result = await this.elasticSearchService.getSearchService().search({
      index: 'services',
      body: {
        query,
        size: 0, // No need to return documents, only aggregations
        aggs: {
          // First, group by period
          by_period: {
            date_histogram: {
              field: 'createdAt',
              calendar_interval: dateHistogramInterval,
              format: dateHistogramFormat,
              min_doc_count: 0 // Include empty buckets
            },
            aggs: {
              // Then, for each period, group by payment method
              by_payment_method: {
                terms: {
                  field: 'metadata.payment_method.keyword',
                  size: 50, // Get up to 50 payment methods
                  missing: 'Not Specified' // Handle missing values
                },
                aggs: {
                  // Calculate total value for each payment method
                  total_value: {
                    sum: {
                      field: 'metadata.value'
                    }
                  },
                  // Count vouchers for each payment method
                  voucher_count: {
                    sum: {
                      script: {
                        source: `
                          int count = 0;
                          if (doc['metadata.voucher'].size() > 0) {
                            for (int i = 0; i < doc['metadata.voucher'].size(); i++) {
                              def voucher = doc['metadata.voucher'][i];
                              if (voucher.containsKey('Vouchers') && voucher['Vouchers'] != null) {
                                count += voucher['Vouchers'];
                              } else {
                                count += 1;
                              }
                            }
                            return count;
                          }
                          return 1;
                        `
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Process aggregation results
    const periodBuckets = result.body.aggregations.by_period.buckets;
    
    // Format results for the chart
    const formattedData = this.processPaymentMethodData(periodBuckets, periodType);
    
    // Cache the results
    this.cache.set(cacheKey, { 
      data: formattedData,
      timestamp: Date.now(),
      totalValue: 0 // Not used but needed for the cache interface
    });
    
    return {
      success: true,
      data: formattedData
    };
  } catch (error) {
    // If script fails, fallback to a simpler method
    if (error.message && error.message.includes('script')) {
      return this.getPaymentMethodStatisticsFallback(filters);
    }
    
    console.error('Error generating payment method statistics:', error);
    return {
      success: false,
      message: 'Error generating payment method statistics',
      error: error.message || error
    };
  }
}

// Fallback method using simpler aggregations
private async getPaymentMethodStatisticsFallback(filters: GiftVoucherPaymentMethodsDto) {
  try {
    // Build the query for filtering voucher sales
    const query: any = {
      bool: {
        must: [
          { match: { name: 'Gift Voucher Sales' } }
        ],
        filter: []
      }
    };

    // Add date range filter if provided
    if (filters.fromDate || filters.toDate) {
      const dateRange: any = { range: { 'createdAt': {} } };
      if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
      if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
      query.bool.filter.push(dateRange);
    }

    // Define period interval for time aggregation
    const periodType = filters.period || PaymentMethodPeriodType.MONTHLY;
    const dateHistogramInterval = this.getIntervalForPeriod(periodType);
    const dateHistogramFormat = this.getFormatForPeriod(periodType);

    // Execute simpler search with aggregations (without scripts)
    const result = await this.elasticSearchService.getSearchService().search({
      index: 'services',
      body: {
        query,
        size: 0,
        aggs: {
          by_period: {
            date_histogram: {
              field: 'createdAt',
              calendar_interval: dateHistogramInterval,
              format: dateHistogramFormat,
              min_doc_count: 0
            },
            aggs: {
              by_payment_method: {
                terms: {
                  field: 'metadata.payment_method.keyword',
                  size: 50,
                  missing: 'Not Specified'
                },
                aggs: {
                  total_value: {
                    sum: {
                      field: 'metadata.value'
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    // Get a sample to estimate voucher counts
    const sampleResult = await this.elasticSearchService.getSearchService().search({
      index: 'services',
      body: {
        query,
        size: 100,
        _source: ['metadata.payment_method', 'metadata.voucher', 'metadata.value']
      }
    });
    
    const samples = sampleResult.body.hits.hits.map(hit => hit._source);
    
    // Calculate average vouchers per document by payment method
    const methodToAvgVouchers = new Map();
    const methodCounts = new Map();
    
    samples.forEach(doc => {
      if (doc.metadata?.payment_method) {
        const method = doc.metadata.payment_method;
        if (!methodToAvgVouchers.has(method)) {
          methodToAvgVouchers.set(method, 0);
          methodCounts.set(method, 0);
        }
        
        let voucherCount = 0;
        if (doc.metadata?.voucher && Array.isArray(doc.metadata.voucher)) {
          doc.metadata.voucher.forEach(v => {
            if (v && typeof v.Vouchers === 'number') {
              voucherCount += v.Vouchers;
            }
          });
        }
        
        methodToAvgVouchers.set(method, methodToAvgVouchers.get(method) + voucherCount);
        methodCounts.set(method, methodCounts.get(method) + 1);
      }
    });
    
    // Calculate averages
    methodToAvgVouchers.forEach((total, method) => {
      const count = methodCounts.get(method);
      if (count > 0) {
        methodToAvgVouchers.set(method, total / count);
      } else {
        methodToAvgVouchers.set(method, 1); // Default average
      }
    });
    
    // Process aggregation results
    const periodBuckets = result.body.aggregations.by_period.buckets;
    
    // Format results but estimate voucher counts
    const formattedData = this.processPaymentMethodDataFallback(periodBuckets, periodType, methodToAvgVouchers);
    
    return {
      success: true,
      data: formattedData
    };
  } catch (error) {
    console.error('Error in fallback method for payment method statistics:', error);
    return {
      success: false,
      message: 'Error generating payment method statistics',
      error: error.message || error
    };
  }
}

private processPaymentMethodData(periodBuckets: any[], periodType: string) {
  if (!periodBuckets || periodBuckets.length === 0) {
    return {
      periods: [],
      paymentMethods: [],
      data: []
    };
  }
  
  // Format the periods (x-axis)
  const periods = periodBuckets.map(bucket => {
    let periodLabel = bucket.key_as_string;
    
    // Special formatting for weekly periods
    if (periodType === PaymentMethodPeriodType.WEEKLY) {
      const startDate = new Date(bucket.key);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      periodLabel = `${this.formatDateAsMonthDay(startDate)} to ${this.formatDateAsMonthDay(endDate)}`;
    }
    
    return periodLabel;
  });
  
  // Extract all unique payment methods across all periods
  const allPaymentMethods = new Set<string>();
  
  periodBuckets.forEach(periodBucket => {
    const methodBuckets = periodBucket.by_payment_method.buckets;
    methodBuckets.forEach(methodBucket => {
      allPaymentMethods.add(methodBucket.key);
    });
  });
  
  const paymentMethods = Array.from(allPaymentMethods) as string[];
  
  // Build the full dataset
  const paymentMethodsData = paymentMethods.map(method => {
    // For each payment method, collect data across all periods
    const periodData = periodBuckets.map(periodBucket => {
      // Find this payment method in this period's data
      const methodBucket = periodBucket.by_payment_method.buckets.find(b => b.key === method);
      
      if (methodBucket) {
        return {
          totalValue: Math.round(methodBucket.total_value.value * 100) / 100,
          count: Math.round(methodBucket.voucher_count.value)
        };
      } else {
        // No data for this method in this period
        return { totalValue: 0, count: 0 };
      }
    });
    
    // Calculate totals for this payment method across all periods
    const totalValue = periodData.reduce((sum, p) => sum + p.totalValue, 0);
    const totalCount = periodData.reduce((sum, p) => sum + p.count, 0);
    
    return {
      paymentMethod: method,
      data: periodData,
      totalValue: Math.round(totalValue * 100) / 100,
      totalCount
    };
  });
  
  // Prepare data for the table export format (flattened data for all periods)
  const flatData = [];
  
  periodBuckets.forEach((periodBucket, periodIndex) => {
    const periodLabel = periods[periodIndex];
    
    periodBucket.by_payment_method.buckets.forEach(methodBucket => {
      flatData.push({
        period: periodLabel,
        paymentMethod: methodBucket.key,
        totalValue: Math.round(methodBucket.total_value.value * 100) / 100,
        count: Math.round(methodBucket.voucher_count.value),
        __typename: "PaymentMethodStats"
      });
    });
  });
  
  return {
    periods,
    paymentMethods,
    paymentMethodsData,
    flatData
  };
}

private processPaymentMethodDataFallback(periodBuckets: any[], periodType: string, methodToAvgVouchers: Map<string, number>) {
  if (!periodBuckets || periodBuckets.length === 0) {
    return {
      periods: [],
      paymentMethods: [],
      data: []
    };
  }
  
  // Format the periods (x-axis)
  const periods = periodBuckets.map(bucket => {
    let periodLabel = bucket.key_as_string;
    
    // Special formatting for weekly periods
    if (periodType === PaymentMethodPeriodType.WEEKLY) {
      const startDate = new Date(bucket.key);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      periodLabel = `${this.formatDateAsMonthDay(startDate)} to ${this.formatDateAsMonthDay(endDate)}`;
    }
    
    return periodLabel;
  });
  
  // Extract all unique payment methods across all periods
  const allPaymentMethods = new Set<string>();
  
  periodBuckets.forEach(periodBucket => {
    const methodBuckets = periodBucket.by_payment_method.buckets;
    methodBuckets.forEach(methodBucket => {
      allPaymentMethods.add(methodBucket.key);
    });
  });
  
  const paymentMethods = Array.from(allPaymentMethods) as string[];
  
  // Build the full dataset
  const paymentMethodsData = paymentMethods.map(method => {
    // For each payment method, collect data across all periods
    const periodData = periodBuckets.map(periodBucket => {
      // Find this payment method in this period's data
      const methodBucket = periodBucket.by_payment_method.buckets.find(b => b.key === method);
      
      if (methodBucket) {
        // Estimate voucher count using the average
        const avgVouchers = methodToAvgVouchers.get(method) || 1;
        const docCount = methodBucket.doc_count || 0;
        const estimatedCount = Math.round(docCount * avgVouchers);
        
        return {
          totalValue: Math.round(methodBucket.total_value.value * 100) / 100,
          count: estimatedCount
        };
      } else {
        // No data for this method in this period
        return { totalValue: 0, count: 0 };
      }
    });
    
    // Calculate totals for this payment method across all periods
    const totalValue = periodData.reduce((sum, p) => sum + p.totalValue, 0);
    const totalCount = periodData.reduce((sum, p) => sum + p.count, 0);
    
    return {
      paymentMethod: method,
      data: periodData,
      totalValue: Math.round(totalValue * 100) / 100,
      totalCount
    };
  });
  
  // Prepare data for the table export format (flattened data for all periods)
  const flatData = [];
  
  periodBuckets.forEach((periodBucket, periodIndex) => {
    const periodLabel = periods[periodIndex];
    
    periodBucket.by_payment_method.buckets.forEach(methodBucket => {
      const avgVouchers = methodToAvgVouchers.get(methodBucket.key) || 1;
      const docCount = methodBucket.doc_count || 0;
      const estimatedCount = Math.round(docCount * avgVouchers);
      
      flatData.push({
        period: periodLabel,
        paymentMethod: methodBucket.key,
        totalValue: Math.round(methodBucket.total_value.value * 100) / 100,
        count: estimatedCount,
        __typename: "PaymentMethodStats"
      });
    });
  });
  
  return {
    periods,
    paymentMethods,
    paymentMethodsData,
    flatData
  };
}

async getVoucherExtensionsStatistics(filters: GiftVoucherExtensionsDto) {
  try {
    // Create cache key from filters
    const cacheKey = 'voucher_extensions_' + JSON.stringify(filters);
    
    // Check cache
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < this.CACHE_TTL) {
      return {
        success: true,
        data: cachedResult.data
      };
    }

    // Build the query to fetch all voucher data
    const query: any = {
      bool: {
        must: [
          { match: { 'name.keyword': 'Gift Voucher Sales' } }
        ],
        filter: []
      }
    };

    // Add date range filter if provided
    if (filters.fromDate || filters.toDate) {
      const dateRange: any = { range: { 'createdAt': {} } };
      if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
      if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
      query.bool.filter.push(dateRange);
    }

    // Add type of sale filter if provided
    if (filters.typeOfSale) {
      query.bool.filter.push({
        match: { 'type.keyword': filters.typeOfSale }
      });
    }

    // Add payment method filter if provided
    if (filters.paymentMethod) {
      query.bool.filter.push({
        match: { 'metadata.payment_method.keyword': filters.paymentMethod }
      });
    }

    // Add individual-specific filters if type of sale is Individual
    if (filters.typeOfSale === 'Individual Voucher Sale') {
      // Add age range filter if provided
      if (filters.minAge !== undefined || filters.maxAge !== undefined) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge !== undefined) {
          ageRange.range['metadata.customer.age'].gte = filters.minAge.toString();
        }
        if (filters.maxAge !== undefined) {
          ageRange.range['metadata.customer.age'].lte = filters.maxAge.toString();
        }
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender': filters.gender }
        });
      }
    }

    // Define period interval for time aggregation
    const periodType = filters.period || ExtensionPeriodType.MONTHLY;
    const dateHistogramInterval = this.getIntervalForPeriod(periodType);
    const dateHistogramFormat = this.getFormatForPeriod(periodType);

    // Get time-based aggregation for all voucher sales
    const result = await this.elasticSearchService.getSearchService().search({
      index: 'services',
      body: {
        query,
        size: 0,
        aggs: {
          by_period: {
            date_histogram: {
              field: 'createdAt',
              calendar_interval: dateHistogramInterval,
              format: dateHistogramFormat,
              min_doc_count: 0
            }
          }
        }
      }
    });

    // Fetch documents with full source data
    const documentsResult = await this.elasticSearchService.getSearchService().search({
      index: 'services',
      body: {
        query,
        size: 1000, // Increase to get more documents
        _source: ['createdAt', 'metadata']
      }
    });

    const hits = documentsResult.body.hits.hits.map((hit: any) => hit._source);
    
    // Process and filter the voucher extensions
    const formattedData = this.processVoucherExtensionsData(
      hits,
      result.body.aggregations.by_period.buckets,
      periodType,
      filters.denomination
    );
    
    // Cache the results
    this.cache.set(cacheKey, { 
      data: formattedData,
      timestamp: Date.now(),
      totalValue: 0 // Not used but needed for the cache interface
    });
    
    return {
      success: true,
      data: formattedData
    };
  } catch (error) {
    console.error('Error generating voucher extensions statistics:', error);
    return {
      success: false,
      message: 'Error generating voucher extensions statistics',
      error: error.message || error
    };
  }
}

private processVoucherExtensionsData(
  documents: any[], 
  periodBuckets: any[], 
  periodType: string,
  denominationFilter?: number
) {
  if (!documents || documents.length === 0 || !periodBuckets || periodBuckets.length === 0) {
    return {
      periods: [],
      data: [],
      totalCount: 0,
      totalValue: 0
    };
  }
  
  // Format periods according to the period type
  const periods = periodBuckets.map(bucket => {
    let periodLabel = bucket.key_as_string;
    
    // Special formatting for weekly periods
    if (periodType === ExtensionPeriodType.WEEKLY) {
      const startDate = new Date(bucket.key);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      periodLabel = `${this.formatDateAsMonthDay(startDate)} to ${this.formatDateAsMonthDay(endDate)}`;
    }
    
    return {
      key: periodLabel,
      timestamp: bucket.key
    };
  });
  
  // Group documents by period and count extended vouchers
  const periodData = new Map();
  
  // Initialize periods with zero counts
  periods.forEach(period => {
    periodData.set(period.key, {
      period: period.key,
      extensionCount: 0,
      totalValue: 0
    });
  });
  
  // Process each document
  documents.forEach(doc => {
    if (!doc.createdAt || !doc.metadata?.voucher) return;
    
    const date = new Date(doc.createdAt);
    // Find the period this document belongs to
    const periodKey = this.getPeriodKeyForExtensions(date, periodType);
    
    if (!periodData.has(periodKey)) return;
    
    const periodStats = periodData.get(periodKey);
    
    // Count extended vouchers in this document
    if (Array.isArray(doc.metadata.voucher)) {
      doc.metadata.voucher.forEach(voucherPackage => {
        if (!voucherPackage) return;
        
        // Apply denomination filter if provided
        if (denominationFilter !== undefined && voucherPackage.denominations !== denominationFilter) {
          return;
        }
        
        // Process each individual voucher within the package
        if (Array.isArray(voucherPackage.vouchers)) {
          voucherPackage.vouchers.forEach(voucher => {
            if (!voucher) return;
            const isExtended = 
              (voucher.metadata?.status === 'Extended')
            
            if (isExtended) {
              // Count this individual voucher
              periodStats.extensionCount++;
              
              // Add denomination from the voucher metadata if available, otherwise from parent package
              let denomination = 0;
              if (voucher.metadata?.Denomination) {
                // Extract number from format like "50 JOD"
                const denomMatch = voucher.metadata.Denomination.match(/(\d+)/);
                denomination = denomMatch ? parseFloat(denomMatch[1]) : 0;
              } else {
                denomination = voucherPackage.denominations || 0;
              }
              
              periodStats.totalValue += denomination;
            }
          });
        }
      });
    }
  });
  
  // Convert the map to an array and sort by period timestamp
  const sortedData = Array.from(periodData.values())
    .map(period => ({
      ...period,
      extensionCount: period.extensionCount,
      totalValue: Math.round(period.totalValue * 100) / 100
    }));
  
  // Calculate overall totals
  const totalCount = sortedData.reduce((sum, period) => sum + period.extensionCount, 0);
  const totalValue = sortedData.reduce((sum, period) => sum + period.totalValue, 0);
  
  return {
    periods: periods.map(p => p.key),
    data: sortedData,
    totalCount,
    totalValue: Math.round(totalValue * 100) / 100
  };
}

private getPeriodKeyForExtensions(date: Date, periodType: string): string {
  switch (periodType) {
    case ExtensionPeriodType.DAILY:
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    case ExtensionPeriodType.WEEKLY:
      const weekStart = this.getWeekStartDate(date);
      const weekEnd = this.getWeekEndDate(weekStart);
      return `${this.formatDateAsMonthDay(weekStart)} to ${this.formatDateAsMonthDay(weekEnd)}`;
    case ExtensionPeriodType.MONTHLY:
    default:
      return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
  }
}

async getRefundedVouchersStatistics(filters: GiftVoucherExtensionsDto) {
  try {
    // Create cache key from filters
    const cacheKey = 'refunded_vouchers_' + JSON.stringify(filters);
    
    // Check cache
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < this.CACHE_TTL) {
      return {
        success: true,
        data: cachedResult.data
      };
    }

    // Build the query to fetch all voucher data
    const query: any = {
      bool: {
        must: [
          { match: { 'name.keyword': 'Gift Voucher Sales' } }
        ],
        filter: []
      }
    };

    // Add date range filter if provided
    if (filters.fromDate || filters.toDate) {
      const dateRange: any = { range: { 'createdAt': {} } };
      if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
      if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
      query.bool.filter.push(dateRange);
    }

    // Add type of sale filter if provided
    if (filters.typeOfSale) {
      query.bool.filter.push({
        match: { 'type.keyword': filters.typeOfSale }
      });
    }

    // Add payment method filter if provided
    if (filters.paymentMethod) {
      query.bool.filter.push({
        match: { 'metadata.payment_method.keyword': filters.paymentMethod }
      });
    }

    // Add individual-specific filters if type of sale is Individual
    if (filters.typeOfSale === 'Individual Voucher Sale') {
      // Add age range filter if provided
      if (filters.minAge !== undefined || filters.maxAge !== undefined) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge !== undefined) {
          ageRange.range['metadata.customer.age'].gte = filters.minAge.toString();
        }
        if (filters.maxAge !== undefined) {
          ageRange.range['metadata.customer.age'].lte = filters.maxAge.toString();
        }
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender': filters.gender }
        });
      }
    }

    // Define period interval for time aggregation
    const periodType = filters.period || ExtensionPeriodType.MONTHLY;
    const dateHistogramInterval = this.getIntervalForPeriod(periodType);
    const dateHistogramFormat = this.getFormatForPeriod(periodType);

    // Get time-based aggregation for all voucher sales
    const result = await this.elasticSearchService.getSearchService().search({
      index: 'services',
      body: {
        query,
        size: 0,
        aggs: {
          by_period: {
            date_histogram: {
              field: 'createdAt',
              calendar_interval: dateHistogramInterval,
              format: dateHistogramFormat,
              min_doc_count: 0
            }
          }
        }
      }
    });

    // Fetch documents with full source data
    const documentsResult = await this.elasticSearchService.getSearchService().search({
      index: 'services',
      body: {
        query,
        size: 1000, // Increase to get more documents
        _source: ['createdAt', 'metadata']
      }
    });

    const hits = documentsResult.body.hits.hits.map((hit: any) => hit._source);
    
    // Process and filter the voucher extensions
    const formattedData = this.processRefundedVouchersData(
      hits,
      result.body.aggregations.by_period.buckets,
      periodType,
      filters.denomination
    );
    
    // Cache the results
    this.cache.set(cacheKey, { 
      data: formattedData,
      timestamp: Date.now(),
      totalValue: 0 // Not used but needed for the cache interface
    });
    
    return {
      success: true,
      data: formattedData
    };
  } catch (error) {
    console.error('Error generating refunded vouchers statistics:', error);
    return {
      success: false,
      message: 'Error generating refunded vouchers statistics',
      error: error.message || error
    };
  }
}

private processRefundedVouchersData(
  documents: any[], 
  periodBuckets: any[], 
  periodType: string,
  denominationFilter?: number
) {
  if (!documents || documents.length === 0 || !periodBuckets || periodBuckets.length === 0) {
    return {
      periods: [],
      data: [],
      totalCount: 0,
      totalValue: 0
    };
  }
  
  // Format periods according to the period type
  const periods = periodBuckets.map(bucket => {
    let periodLabel = bucket.key_as_string;
    
    // Special formatting for weekly periods
    if (periodType === ExtensionPeriodType.WEEKLY) {
      const startDate = new Date(bucket.key);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      periodLabel = `${this.formatDateAsMonthDay(startDate)} to ${this.formatDateAsMonthDay(endDate)}`;
    }
    
    return {
      key: periodLabel,
      timestamp: bucket.key
    };
  });
  
  // Group documents by period and count extended vouchers
  const periodData = new Map();
  
  // Initialize periods with zero counts
  periods.forEach(period => {
    periodData.set(period.key, {
      period: period.key,
      refundedCount: 0,
      totalValue: 0
    });
  });
  
  // Process each document
  documents.forEach(doc => {
    if (!doc.createdAt || !doc.metadata?.voucher) return;
    
    const date = new Date(doc.createdAt);
    // Find the period this document belongs to
    const periodKey = this.getPeriodKeyForExtensions(date, periodType);
    
    if (!periodData.has(periodKey)) return;
    
    const periodStats = periodData.get(periodKey);
    
    // Count extended vouchers in this document
    if (Array.isArray(doc.metadata.voucher)) {
      doc.metadata.voucher.forEach(voucherPackage => {
        if (!voucherPackage) return;
        
        // Apply denomination filter if provided
        if (denominationFilter !== undefined && voucherPackage.denominations !== denominationFilter) {
          return;
        }
        
        // Process each individual voucher within the package
        if (Array.isArray(voucherPackage.vouchers)) {
          voucherPackage.vouchers.forEach(voucher => {
            if (!voucher) return;
            const isRefunded = 
              (voucher.metadata?.status === 'Refunded')
            
            if (isRefunded) {
              // Count this individual voucher
              periodStats.refundedCount++;
              
              // Add denomination from the voucher metadata if available, otherwise from parent package
              let denomination = 0;
              if (voucher.metadata?.Denomination) {
                // Extract number from format like "50 JOD"
                const denomMatch = voucher.metadata.Denomination.match(/(\d+)/);
                denomination = denomMatch ? parseFloat(denomMatch[1]) : 0;
              } else {
                denomination = voucherPackage.denominations || 0;
              }
              
              periodStats.totalValue += denomination;
            }
          });
        }
      });
    }
  });
  
  // Convert the map to an array and sort by period timestamp
  const sortedData = Array.from(periodData.values())
    .map(period => ({
      ...period,
      refundedCount: period.refundedCount,
      totalValue: Math.round(period.totalValue * 100) / 100
    }));
  
  // Calculate overall totals
  const totalCount = sortedData.reduce((sum, period) => sum + period.refundedCount, 0);
  const totalValue = sortedData.reduce((sum, period) => sum + period.totalValue, 0);
  
  return {
    periods: periods.map(p => p.key),
    data: sortedData,
    totalCount,
    totalValue: Math.round(totalValue * 100) / 100
  };
}


} 