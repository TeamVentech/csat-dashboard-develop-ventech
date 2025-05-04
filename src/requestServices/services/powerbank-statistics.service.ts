import { Injectable } from '@nestjs/common';
import { ElasticService } from '../../ElasticSearch/elasticsearch.service';
import * as moment from 'moment';

@Injectable()
export class PowerBankStatisticsService {
  constructor(private readonly elasticSearchService: ElasticService) {}

  async getPowerBankChartData(filters: {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    fromDate?: string;
    toDate?: string;
    period?: string;
  }) {
    try {
      // Build the query
      const query: any = {
        bool: {
          must: [
            { match: { 'type.keyword': 'Power Bank Request' } }
          ],
          filter: []
        }
      };

      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge) ageRange.range['metadata.customer.age'].gte = filters.minAge;
        if (filters.maxAge) ageRange.range['metadata.customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender.keyword': filters.gender }
        });
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
      
      // Process data for chart based on the period type
      const chartData = this.processPowerBankChartData(hits, filters.period);
      
      return {
        success: true,
        data: {
          powerBankData: chartData
        }
      };
    } catch (error) {
      console.error('Error generating power bank chart data:', error);
      return {
        success: false,
        message: 'Error generating power bank chart data',
        error: error.message || error
      };
    }
  }

  async getAverageDurationData(filters: {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    fromDate?: string;
    toDate?: string;
    period?: string;
  }) {
    try {
      // Build the query
      const query: any = {
        bool: {
          must: [
            { match: { 'type.keyword': 'Power Bank Request' } },
            { match: { 'state.keyword': 'Item Returned' } } // Only consider completed requests
          ],
          filter: []
        }
      };

      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge) ageRange.range['metadata.customer.age'].gte = filters.minAge;
        if (filters.maxAge) ageRange.range['metadata.customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender.keyword': filters.gender }
        });
      }

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { 'createdAt': {} } };
        if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        query.bool.filter.push(dateRange);
      }

      // Must have return date and time
      query.bool.filter.push({
        exists: { field: 'metadata.returnDate' }
      });
      query.bool.filter.push({
        exists: { field: 'metadata.returnTime' }
      });

      // Execute search query

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 10000 // Get all matching documents
        }
      });
      const hits = result.body.hits.hits.map((hit: any) => hit._source);
      
      // Filter out invalid data
      const validData = hits.filter(item => 
        item.metadata && 
        item.metadata.returnDate && 
        item.metadata.returnTime &&
        item.metadata.type &&
        (item.metadata.type === 'Power Bank') &&
        item.createdAt
      );
      
      // Process data for chart based on the period type
      const durationData = this.processAverageDurationData(validData, filters.period);
      
      return {
        success: true,
        data: {
          powerBankStats: {
            categories: durationData.categories,
            series: durationData.series,
            description: "This chart shows both the average duration in minutes and the count of requests for power bank services"
          }
        }
      };
    } catch (error) {
      console.error('Error generating average duration data:', error);
      return {
        success: false,
        message: 'Error generating average duration data',
        error: error.message || error
      };
    }
  }

  async getDamagedCasesData(filters: {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    fromDate?: string;
    toDate?: string;
    period?: string;
  }) {
    try {
      // Build the query
      const query: any = {
        bool: {
          must: [
            { match: { 'type.keyword': 'Power Bank Request' } },
            { match: { 'state.keyword': 'Item Returned' } }
          ],
          filter: [
            {
              terms: { 
                'metadata.condition.keyword': [
                  'Wire damaged',
                  'Powerbank damaged',
                  'Powerbank and Wire damaged'
                ]
              }
            }
          ]
        }
      };

      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge) ageRange.range['metadata.customer.age'].gte = filters.minAge;
        if (filters.maxAge) ageRange.range['metadata.customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender.keyword': filters.gender }
        });
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
      
      // Filter out invalid data
      const validData = hits.filter(item => 
        item.metadata && 
        (item.metadata.condition === 'Wire damaged' || item.metadata.condition === 'Powerbank damaged' || item.metadata.condition === 'Powerbank and Wire damaged') &&
        item.createdAt
      );
      
      // Process data for chart based on the period type
      const chartData = this.processDamagedCasesData(validData, filters.period);
      
      // Create the table data
      const tableData = this.createDamagedCasesTableData(validData, filters.period, {
        minAge: filters.minAge,
        maxAge: filters.maxAge,
        gender: filters.gender
      });
      
      return {
        success: true,
        data: {
          damagedCasesStats: {
            chart: chartData,
            table: tableData
          }
        }
      };
    } catch (error) {
      console.error('Error generating damaged cases data:', error);
      return {
        success: false,
        message: 'Error generating damaged cases data',
        error: error.message || error
      };
    }
  }

  async getNotReturnedItemsData(filters: {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    fromDate?: string;
    toDate?: string;
    period?: string;
  }) {
    try {
      // Build the query
      const query: any = {
        bool: {
          must: [
            { match: { 'type.keyword': 'Power Bank Request' } },
            { match: { 'state.keyword': 'Item Not Returned' } }
          ],
          filter: []
        }
      };

      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge) ageRange.range['metadata.customer.age'].gte = filters.minAge;
        if (filters.maxAge) ageRange.range['metadata.customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender.keyword': filters.gender }
        });
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
      
      // Filter out invalid data
      const validData = hits.filter(item => 
        item.metadata && 
        item.metadata.type &&
        (item.metadata.type === 'Power Bank') &&
        item.createdAt
      );
      
      // Process data for chart based on the period type
      const chartData = this.processNotReturnedItemsData(validData, filters.period);
      
      // Create the table data
      const tableData = this.createNotReturnedItemsTableData(validData, filters.period, {
        minAge: filters.minAge,
        maxAge: filters.maxAge,
        gender: filters.gender
      });
      
      return {
        success: true,
        data: {
          notReturnedItemsStats: {
            chart: chartData,
            table: tableData
          }
        }
      };
    } catch (error) {
      console.error('Error generating not returned items data:', error);
      return {
        success: false,
        message: 'Error generating not returned items data',
        error: error.message || error
      };
    }
  }

  async getDeliveryPickupServicesData(filtersd) {
    try {
      // Build the query
      const query: any = {
        bool: {
          must: [
            { match: { 'type.keyword': 'Power Bank Request' } }
          ],
          should: [
            { match: { 'metadata.delivery': true } },
            { match: { 'metadata.pickUp': true } }
          ],
          minimum_should_match: 1,
          filter: []
        }
      };
      const filters = filtersd.params
      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge) ageRange.range['metadata.customer.age'].gte = filters.minAge;
        if (filters.maxAge) ageRange.range['metadata.customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender.keyword': filters.gender }
        });
      }

      // Add request source filter if provided
      if (filters.requestSource) {
        query.bool.filter.push({
          match: { 'metadata.request_source.keyword': filters.requestSource }
        });
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
      
      // Filter out invalid data
      const validData = hits.filter(item => 
        item.metadata && 
        (item.metadata.delivery === true || item.metadata.pickUp === true) &&
        item.createdAt
      );
      
      // Process data for chart based on the period type
      const chartData = this.processDeliveryPickupServicesData(validData, filters.period);
      const tableData = this.createDeliveryPickupServicesTableData(validData, filters.period, {
        minAge: filters.minAge,
        maxAge: filters.maxAge,
        gender: filters.gender,
        requestSource: filters.requestSource
      });

      // Additional statistics
      const deliveryStats = this.calculateDeliveryPickupStats(validData);
      
      return {
        success: true,
        data: {
          deliveryPickupStats: {
            chart: chartData,
            table: tableData,
            summary: deliveryStats
          }
        }
      };
    } catch (error) {
      console.error('Error generating delivery/pickup services data:', error);
      return {
        success: false,
        message: 'Error generating delivery/pickup services data',
        error: error.message || error
      };
    }
  }

  private calculateDeliveryPickupStats(data: any[]) {
    const stats = {
      totalCount: data.length,
      deliveryOnlyCount: 0,
      pickupOnlyCount: 0,
      bothDeliveryAndPickupCount: 0,
      powerBankCount: 0,
      requestSources: {
        'QR Code': 0,
        'Hotline': 0,
        'CC Desk': 0,
        'Other': 0
      }
    };

    data.forEach(item => {
      const hasDelivery = item.metadata?.delivery === true;
      const hasPickup = item.metadata?.pickUp === true;
      const type = item.metadata?.type || 'Unknown';
      const requestSource = item.metadata?.request_source || 'Other';

      // Count by delivery/pickup
      if (hasDelivery && hasPickup) {
        stats.bothDeliveryAndPickupCount++;
      } else if (hasDelivery) {
        stats.deliveryOnlyCount++;
      } else if (hasPickup) {
        stats.pickupOnlyCount++;
      }

      // Count by type
      if (type === 'Power Bank') {
        stats.powerBankCount++;
      }

      // Count by request source
      if (requestSource === 'QR Code' || requestSource === 'Hotline' || requestSource === 'CC Desk') {
        stats.requestSources[requestSource]++;
      } else {
        stats.requestSources['Other']++;
      }
    });

    return stats;
  }

  private processPowerBankChartData(data: any[], periodType: string = 'Monthly') {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyData(data);
        break;
      case 'Weekly':
        processedData = this.processWeeklyData(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyData(data);
        break;
    }
    
    return processedData;
  }

  private processDailyData(data: any[]) {
    // Group by day and type (Power Bank)
    const groupedByDay: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByDay[date].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(date => groupedByDay[date].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyData(data: any[]) {
    // Group by week and type (Power Bank)
    const groupedByWeek: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByWeek[weekLabel].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(week => groupedByWeek[week].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyData(data: any[]) {
    // Group by month and type (Power Bank)
    const groupedByMonth: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByMonth[monthLabel].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(month => groupedByMonth[month].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processAverageDurationData(data: any[], periodType: string = 'Monthly') {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyDurationData(data);
        break;
      case 'Weekly':
        processedData = this.processWeeklyDurationData(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyDurationData(data);
        break;
    }
    
    return processedData;
  }

  private calculateDurationInMinutes(item: any): number {
    try {
      const returnDate = item.metadata.returnDate;
      const returnTime = item.metadata.returnTime;
      
      // Combine return date and time
      const returnDateTime = moment(`${returnDate} ${returnTime}`, 'YYYY-MM-DD HH:mm');
      const startMomentTime = moment(item.createdAt, 'YYYY-MM-DD HH:mm');
      // Calculate duration in minutes
      const durationMinutes = returnDateTime.diff(startMomentTime, 'minutes');
      // Filter out negative or unreasonably large durations (more than 30 days)
      if (durationMinutes < 0 || durationMinutes > 43200) {
        return null;
      }
      
      return durationMinutes;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return null;
    }
  }

  private processDailyDurationData(data: any[]) {
    // Group by day and type (Power Bank)
    const groupedByDay: Record<string, { 
      PowerBank: { totalDuration: number, count: number }
    }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { 
        PowerBank: { totalDuration: 0, count: 0 }
      };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      const durationMinutes = this.calculateDurationInMinutes(item);
      
      if (durationMinutes && moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { 
            PowerBank: { totalDuration: 0, count: 0 }
          };
        }
        
        if (type === 'Power Bank') {
          groupedByDay[date].PowerBank.totalDuration += durationMinutes;
          groupedByDay[date].PowerBank.count += 1;
        }
      }
    });
    
    // Calculate averages and format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Power Bank - Average Duration (minutes)',
        data: categories.map(date => {
          const group = groupedByDay[date].PowerBank;
          return group.count > 0 ? parseFloat((group.totalDuration / group.count).toFixed(1)) : 0;
        })
      },
      {
        name: 'Power Bank - Request Count',
        data: categories.map(date => groupedByDay[date].PowerBank.count)
      }

    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyDurationData(data: any[]) {
    // Group by week and type (Power Bank)
    const groupedByWeek: Record<string, { 
      PowerBank: { totalDuration: number, count: number }
    }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { 
        PowerBank: { totalDuration: 0, count: 0 }
      };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      const durationMinutes = this.calculateDurationInMinutes(item);
      
      if (durationMinutes && itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { 
            PowerBank: { totalDuration: 0, count: 0 }
          };
        }
        
        if (type === 'Power Bank') {
          groupedByWeek[weekLabel].PowerBank.totalDuration += durationMinutes;
          groupedByWeek[weekLabel].PowerBank.count += 1;
        }
      }
    });
    
    // Calculate averages and format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Power Bank - Average Duration (minutes)',
        data: categories.map(week => {
          const group = groupedByWeek[week].PowerBank;
          return group.count > 0 ? parseFloat((group.totalDuration / group.count).toFixed(1)) : 0;
        })
      },
      {
        name: 'Power Bank - Request Count',
        data: categories.map(week => groupedByWeek[week].PowerBank.count)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyDurationData(data: any[]) {
      // Group by month and type (Power Bank)
    const groupedByMonth: Record<string, { 
      PowerBank: { totalDuration: number, count: number }
    }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { 
        PowerBank: { totalDuration: 0, count: 0 }
      };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      const durationMinutes = this.calculateDurationInMinutes(item);
      
      if (durationMinutes && moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { 
            PowerBank: { totalDuration: 0, count: 0 }
          };
        }
        
        if (type === 'Power Bank') {
          groupedByMonth[monthLabel].PowerBank.totalDuration += durationMinutes;
          groupedByMonth[monthLabel].PowerBank.count += 1;
        }
      }
    });
    
    // Calculate averages and format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Power Bank - Average Duration (minutes)',
        data: categories.map(month => {
          const group = groupedByMonth[month].PowerBank;
          return group.count > 0 ? parseFloat((group.totalDuration / group.count).toFixed(1)) : 0;
        })
      },
      {
        name: 'Power Bank - Request Count',
        data: categories.map(month => groupedByMonth[month].PowerBank.count)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processDamagedCasesData(data: any[], periodType: string = 'Monthly') {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyDamagedCasesData(data);
        break;
      case 'Weekly':
        processedData = this.processWeeklyDamagedCasesData(data);
        break;
      case 'Time of Day':
        processedData = this.processTimeOfDayDamagedCasesData(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyDamagedCasesData(data);
        break;
    }
    
    return processedData;
  }

  private processDailyDamagedCasesData(data: any[]) {
    // Group by day
    const groupedByDay: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByDay[date].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(date => groupedByDay[date].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyDamagedCasesData(data: any[]) {
    // Group by week
    const groupedByWeek: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByWeek[weekLabel].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(week => groupedByWeek[week].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyDamagedCasesData(data: any[]) {
    // Group by month
    const groupedByMonth: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByMonth[monthLabel].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(month => groupedByMonth[month].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processTimeOfDayDamagedCasesData(data: any[]) {
    // Group by time of day
    const timeSlots = [
      { label: '00:00 - 05:59', start: 0, end: 5 },
      { label: '06:00 - 11:59', start: 6, end: 11 },
      { label: '12:00 - 17:59', start: 12, end: 17 },
      { label: '18:00 - 23:59', start: 18, end: 23 }
    ];
    
    const groupedByTime: Record<string, { PowerBank: number }> = {};
    
    // Initialize time slots
    timeSlots.forEach(slot => {
      groupedByTime[slot.label] = { PowerBank: 0 };
    });
    
    // Group data
    data.forEach(item => {
      const hour = moment(item.createdAt).hour();
      const type = item.metadata?.type || 'Unknown';
      
      const timeSlot = timeSlots.find(slot => hour >= slot.start && hour <= slot.end);
      
      if (timeSlot) {
        if (type === 'Power Bank') {
          groupedByTime[timeSlot.label].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = timeSlots.map(slot => slot.label);
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(time => groupedByTime[time].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private createDamagedCasesTableData(data: any[], periodType: string = 'Monthly', filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    let tableData = [];
    
    switch (periodType) {
      case 'Daily':
        tableData = this.createDailyDamagedCasesTableData(data, filters);
        break;
      case 'Weekly':
        tableData = this.createWeeklyDamagedCasesTableData(data, filters);
        break;
      case 'Time of Day':
        tableData = this.createTimeOfDayDamagedCasesTableData(data, filters);
        break;
      case 'Monthly':
      default:
        tableData = this.createMonthlyDamagedCasesTableData(data, filters);
        break;
    }
    
    return tableData;
  }

  private createDailyDamagedCasesTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by day
    const groupedByDay: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByDay[date].PowerBank += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return Object.keys(groupedByDay)
      .sort((a, b) => moment(a).diff(moment(b)))
      .filter(date => groupedByDay[date].PowerBank > 0)
      .map(date => ({
        period: date,
        powerBankCount: groupedByDay[date].PowerBank,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private createWeeklyDamagedCasesTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by week
    const groupedByWeek: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByWeek[weekLabel].PowerBank += 1;
          }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return Object.keys(groupedByWeek)
      .filter(week => groupedByWeek[week].PowerBank > 0)
      .map(week => ({
        period: week,
        powerBankCount: groupedByWeek[week].PowerBank,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private createMonthlyDamagedCasesTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by month
    const groupedByMonth: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { PowerBank: 0 };
        }
        
          if (type === 'Power Bank') {
          groupedByMonth[monthLabel].PowerBank += 1;
          }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return Object.keys(groupedByMonth)
      .filter(month => groupedByMonth[month].PowerBank > 0)
      .map(month => ({
        period: month,
        powerBankCount: groupedByMonth[month].PowerBank,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private createTimeOfDayDamagedCasesTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by time of day
    const timeSlots = [
      { label: '00:00 - 05:59', start: 0, end: 5 },
      { label: '06:00 - 11:59', start: 6, end: 11 },
      { label: '12:00 - 17:59', start: 12, end: 17 },
      { label: '18:00 - 23:59', start: 18, end: 23 }
    ];
    
    const groupedByTime: Record<string, { PowerBank: number }> = {};
    
    // Initialize time slots
    timeSlots.forEach(slot => {
      groupedByTime[slot.label] = { PowerBank: 0 };
    });
    
    // Group data
    data.forEach(item => {
      const hour = moment(item.createdAt).hour();
      const type = item.metadata?.type || 'Unknown';
      
      const timeSlot = timeSlots.find(slot => hour >= slot.start && hour <= slot.end);
      
      if (timeSlot) {
        if (type === 'Power Bank') {
          groupedByTime[timeSlot.label].PowerBank += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return timeSlots
      .map(slot => slot.label)
      .filter(time => groupedByTime[time].PowerBank > 0)
      .map(time => ({
        period: time,
        powerBankCount: groupedByTime[time].PowerBank,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private getAgeRangeText(filters: { minAge?: number, maxAge?: number, gender?: string } = {}): string {
    if (filters.minAge && filters.maxAge) {
      return `${filters.minAge}-${filters.maxAge}`;
    } else if (filters.minAge) {
      return `${filters.minAge}+`;
    } else if (filters.maxAge) {
      return `0-${filters.maxAge}`;
    } else {
      return '';
    }
  }

  private processNotReturnedItemsData(data: any[], periodType: string = 'Monthly') {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyNotReturnedItemsData(data);
        break;
      case 'Weekly':
        processedData = this.processWeeklyNotReturnedItemsData(data);
        break;
      case 'Time of Day':
        processedData = this.processTimeOfDayNotReturnedItemsData(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyNotReturnedItemsData(data);
        break;
    }
    
    return processedData;
  }

  private processDailyNotReturnedItemsData(data: any[]) {
    // Group by day
    const groupedByDay: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByDay[date].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(date => groupedByDay[date].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyNotReturnedItemsData(data: any[]) {
    // Group by week
    const groupedByWeek: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { PowerBank: 0 };
        }
        
          if (type === 'Power Bank') {
          groupedByWeek[weekLabel].PowerBank += 1;
          }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(week => groupedByWeek[week].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyNotReturnedItemsData(data: any[]) {
    // Group by month
    const groupedByMonth: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByMonth[monthLabel].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(month => groupedByMonth[month].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processTimeOfDayNotReturnedItemsData(data: any[]) {
    // Group by time of day
    const timeSlots = [
      { label: '00:00 - 05:59', start: 0, end: 5 },
      { label: '06:00 - 11:59', start: 6, end: 11 },
      { label: '12:00 - 17:59', start: 12, end: 17 },
      { label: '18:00 - 23:59', start: 18, end: 23 }
    ];
    
    const groupedByTime: Record<string, { PowerBank: number }> = {};
    
    // Initialize time slots
    timeSlots.forEach(slot => {
      groupedByTime[slot.label] = { PowerBank: 0 };
    });
    
    // Group data
    data.forEach(item => {
      const hour = moment(item.createdAt).hour();
      const type = item.metadata?.type || 'Unknown';
      
      const timeSlot = timeSlots.find(slot => hour >= slot.start && hour <= slot.end);
      
      if (timeSlot) {
        if (type === 'Power Bank') {
          groupedByTime[timeSlot.label].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = timeSlots.map(slot => slot.label);
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(time => groupedByTime[time].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private createNotReturnedItemsTableData(data: any[], periodType: string = 'Monthly', filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    let tableData = [];
    
    switch (periodType) {
      case 'Daily':
        tableData = this.createDailyNotReturnedItemsTableData(data, filters);
        break;
      case 'Weekly':
        tableData = this.createWeeklyNotReturnedItemsTableData(data, filters);
        break;
      case 'Time of Day':
        tableData = this.createTimeOfDayNotReturnedItemsTableData(data, filters);
        break;
      case 'Monthly':
      default:
        tableData = this.createMonthlyNotReturnedItemsTableData(data, filters);
        break;
    }
    
    return tableData;
  }

  private createDailyNotReturnedItemsTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by day
    const groupedByDay: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByDay[date].PowerBank += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return Object.keys(groupedByDay)
      .sort((a, b) => moment(a).diff(moment(b)))
      .filter(date => groupedByDay[date].PowerBank > 0)
      .map(date => ({
        period: date,
        powerBankCount: groupedByDay[date].PowerBank,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private createWeeklyNotReturnedItemsTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by week
    const groupedByWeek: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByWeek[weekLabel].PowerBank += 1;
          }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return Object.keys(groupedByWeek)
      .filter(week => groupedByWeek[week].PowerBank > 0)
      .map(week => ({
        period: week,
        powerBankCount: groupedByWeek[week].PowerBank,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private createMonthlyNotReturnedItemsTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by month
    const groupedByMonth: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByMonth[monthLabel].PowerBank += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return Object.keys(groupedByMonth)
      .filter(month => groupedByMonth[month].PowerBank > 0)
      .map(month => ({
        period: month,
        powerBankCount: groupedByMonth[month].PowerBank,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private createTimeOfDayNotReturnedItemsTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by time of day
    const timeSlots = [
      { label: '00:00 - 05:59', start: 0, end: 5 },
      { label: '06:00 - 11:59', start: 6, end: 11 },
      { label: '12:00 - 17:59', start: 12, end: 17 },
      { label: '18:00 - 23:59', start: 18, end: 23 }
    ];
    
    const groupedByTime: Record<string, { PowerBank: number }> = {};
    
    // Initialize time slots
    timeSlots.forEach(slot => {
      groupedByTime[slot.label] = { PowerBank: 0 };
    });
    
    // Group data
    data.forEach(item => {
      const hour = moment(item.createdAt).hour();
      const type = item.metadata?.type || 'Unknown';
      
      const timeSlot = timeSlots.find(slot => hour >= slot.start && hour <= slot.end);
      
      if (timeSlot) {
        if (type === 'Power Bank') {
          groupedByTime[timeSlot.label].PowerBank += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return timeSlots
      .map(slot => slot.label)
      .filter(time => groupedByTime[time].PowerBank > 0)
      .map(time => ({
        period: time,
        powerBankCount: groupedByTime[time].PowerBank,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private processDeliveryPickupServicesData(data: any[], periodType: string = 'Monthly') {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyDeliveryPickupServicesData(data);
        break;
      case 'Weekly':
        processedData = this.processWeeklyDeliveryPickupServicesData(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyDeliveryPickupServicesData(data);
        break;
    }
    
    return processedData;
  }

  private processDailyDeliveryPickupServicesData(data: any[]) {
    // Group by day
    const groupedByDay: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByDay[date].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(date => groupedByDay[date].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyDeliveryPickupServicesData(data: any[]) {
    // Group by week
    const groupedByWeek: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByWeek[weekLabel].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(week => groupedByWeek[week].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyDeliveryPickupServicesData(data: any[]) {
    // Group by month
    const groupedByMonth: Record<string, { PowerBank: number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { PowerBank: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { PowerBank: 0 };
        }
        
        if (type === 'Power Bank') {
          groupedByMonth[monthLabel].PowerBank += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Power Bank',
        data: categories.map(month => groupedByMonth[month].PowerBank)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private createDeliveryPickupServicesTableData(data: any[], periodType: string = 'Monthly', filters: { 
    minAge?: number, 
    maxAge?: number, 
    gender?: string,
    requestSource?: string 
  } = {}) {
    let tableData = [];

    switch (periodType) {
      case 'Daily':
        tableData = this.createDailyDeliveryPickupServicesTableData(data, filters);
        break;
      case 'Weekly':
        tableData = this.createWeeklyDeliveryPickupServicesTableData(data, filters);
        break;
      case 'Monthly':
      default:
        tableData = this.createMonthlyDeliveryPickupServicesTableData(data, filters);
        break;
    }
    
    return tableData;
  }

  private createDailyDeliveryPickupServicesTableData(data: any[], filters: { 
    minAge?: number, 
    maxAge?: number, 
    gender?: string,
    requestSource?: string 
  } = {}) {
    // Group by day
    const groupedByDay: Record<string, { 
      PowerBank: { delivery: number, pickup: number, both: number, total: number }
    }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { 
        PowerBank: { delivery: 0, pickup: 0, both: 0, total: 0 }
      };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      const hasDelivery = item.metadata?.delivery === true;
      const hasPickup = item.metadata?.pickUp === true;
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { 
            PowerBank: { delivery: 0, pickup: 0, both: 0, total: 0 }
          };
        }
        
        if (type === 'Power Bank') {
          if (hasDelivery && hasPickup) {
            groupedByDay[date].PowerBank.both += 1;
          } else if (hasDelivery) {
            groupedByDay[date].PowerBank.delivery += 1;
          } else if (hasPickup) {
            groupedByDay[date].PowerBank.pickup += 1;
          }
          groupedByDay[date].PowerBank.total += 1;
        } 
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    const requestSourceText = filters.requestSource ? `${filters.requestSource}` : '';
    
    return Object.keys(groupedByDay)
      .sort((a, b) => moment(a).diff(moment(b)))
      .filter(date => {
        const day = groupedByDay[date];
        return day.PowerBank.total > 0;
      })
      .map(date => {
        const day = groupedByDay[date];
        return {
          period: date,
          powerBank: {
            deliveryOnly: day.PowerBank.delivery,
            pickupOnly: day.PowerBank.pickup,
            both: day.PowerBank.both,
              total: day.PowerBank.total
          },
            ageRange: ageRangeText,
          gender: genderText,
          requestSource: requestSourceText
        };
      });
  }

  private createWeeklyDeliveryPickupServicesTableData(data: any[], filters: { 
    minAge?: number, 
    maxAge?: number, 
    gender?: string,
    requestSource?: string 
  } = {}) {
    // Group by week
    const groupedByWeek: Record<string, { 
      PowerBank: { delivery: number, pickup: number, both: number, total: number }
    }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { 
        PowerBank: { delivery: 0, pickup: 0, both: 0, total: 0 }
      };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      const hasDelivery = item.metadata?.delivery === true;
      const hasPickup = item.metadata?.pickUp === true;
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { 
            PowerBank: { delivery: 0, pickup: 0, both: 0, total: 0 }
          };
        }
        
        if (type === 'Power Bank') {
          if (hasDelivery && hasPickup) {
            groupedByWeek[weekLabel].PowerBank.both += 1;
          } else if (hasDelivery) {
            groupedByWeek[weekLabel].PowerBank.delivery += 1;
          } else if (hasPickup) {
            groupedByWeek[weekLabel].PowerBank.pickup += 1;
          }
          groupedByWeek[weekLabel].PowerBank.total += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    const requestSourceText = filters.requestSource ? `${filters.requestSource}` : '';
    
    return Object.keys(groupedByWeek)
      .filter(week => {
        const weekData = groupedByWeek[week];
        return weekData.PowerBank.total > 0;
      })
      .map(week => {
        const weekData = groupedByWeek[week];
        return {
          period: week,
          powerBank: {
            deliveryOnly: weekData.PowerBank.delivery,
            pickupOnly: weekData.PowerBank.pickup,
            both: weekData.PowerBank.both,
            total: weekData.PowerBank.total
          },
          ageRange: ageRangeText,
          gender: genderText,
          requestSource: requestSourceText
        };
      });
  }

  private createMonthlyDeliveryPickupServicesTableData(data: any[], filters: { 
    minAge?: number, 
    maxAge?: number, 
    gender?: string,
    requestSource?: string 
  } = {}) {
    // Group by month
    const groupedByMonth: Record<string, { 
      PowerBank: { delivery: number, pickup: number, both: number, total: number }
    }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { 
        PowerBank: { delivery: 0, pickup: 0, both: 0, total: 0 }
      };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      const hasDelivery = item.metadata?.delivery === true;
      const hasPickup = item.metadata?.pickUp === true;
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { 
            PowerBank: { delivery: 0, pickup: 0, both: 0, total: 0 }
          };
        }
        
        if (type === 'Power Bank') {
          if (hasDelivery && hasPickup) {
            groupedByMonth[monthLabel].PowerBank.both += 1;
          } else if (hasDelivery) {
            groupedByMonth[monthLabel].PowerBank.delivery += 1;
          } else if (hasPickup) {
            groupedByMonth[monthLabel].PowerBank.pickup += 1;
          }
          groupedByMonth[monthLabel].PowerBank.total += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    const requestSourceText = filters.requestSource ? `${filters.requestSource}` : '';
    
    return Object.keys(groupedByMonth)
      .filter(month => {
        const monthData = groupedByMonth[month];
        return monthData.PowerBank.total > 0;
      })
      .map(month => {
        const monthData = groupedByMonth[month];
        return {
          period: month,
          powerBank: {
            deliveryOnly: monthData.PowerBank.delivery,
            pickupOnly: monthData.PowerBank.pickup,
            both: monthData.PowerBank.both,
            total: monthData.PowerBank.total
          },
          ageRange: ageRangeText,
          gender: genderText,
          requestSource: requestSourceText
        };
      });
  }

  async getRequestSourceReportData(filters: {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    fromDate?: string;
    toDate?: string;
    period?: string;
  }) {
    try {
      // Build the query
      const query: any = {
        bool: {
          must: [
              { match: { 'type.keyword': 'Power Bank Request' } }
          ],
          filter: []
        }
      };

      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge) ageRange.range['metadata.customer.age'].gte = filters.minAge;
        if (filters.maxAge) ageRange.range['metadata.customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender.keyword': filters.gender }
        });
      }

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { 'createdAt': {} } };
        if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        query.bool.filter.push(dateRange);
      }

      // Must have request_source field
      query.bool.filter.push({
        exists: { field: 'metadata.request_source' }
      });

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 10000 // Get all matching documents
        }
      });
      const hits = result.body.hits.hits.map((hit: any) => hit._source);
      
      // Filter out invalid data
      const validData = hits.filter(item => 
        item.metadata && 
        item.metadata.request_source &&
        item.createdAt
      );
      
      // Process data for chart based on the period type
      const chartData = this.processRequestSourceReportData(validData, filters.period);
      
      // Generate summary data for each request source
      const summary = this.generateRequestSourceSummary(validData);
      
      return {
        success: true,
        data: {
          requestSourceReport: {
            chart: chartData,
            summary: summary
          }
        }
      };
    } catch (error) {
      console.error('Error generating request source report data:', error);
      return {
        success: false,
        message: 'Error generating request source report data',
        error: error.message || error
      };
    }
  }

  private generateRequestSourceSummary(data: any[]) {
    const summary = {
      totalCount: data.length,
      sourceCounts: {
        'QR Code': 0,
        'Hotline': 0,
        'CC Desk': 0,
        'Other': 0
      },
      powerBankCounts: {
        'QR Code': 0,
        'Hotline': 0,
        'CC Desk': 0,
        'Other': 0
      } 
    };

    data.forEach(item => {
      const requestSource = item.metadata?.request_source || 'Other';
      const sourceKey = ['QR Code', 'Hotline', 'CC Desk'].includes(requestSource) ? requestSource : 'Other';
      const type = item.metadata?.type || 'Unknown';
      
      // Count by source
      summary.sourceCounts[sourceKey]++;
      
      // Count by type and source
      if (type === 'Power Bank') {
        summary.powerBankCounts[sourceKey]++;
      }
    });

    return summary;
  }

  private processRequestSourceReportData(data: any[], periodType: string = 'Monthly') {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyRequestSourceData(data);
        break;
      case 'Weekly':
        processedData = this.processWeeklyRequestSourceData(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyRequestSourceData(data);
        break;
    }
    
    return processedData;
  }

  private processDailyRequestSourceData(data: any[]) {
    // Group by day and request source
    const groupedByDay: Record<string, { 'QR Code': number, 'Hotline': number, 'CC Desk': number, 'Other': number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { 'QR Code': 0, 'Hotline': 0, 'CC Desk': 0, 'Other': 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const requestSource = item.metadata?.request_source || 'Other';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { 'QR Code': 0, 'Hotline': 0, 'CC Desk': 0, 'Other': 0 };
        }
        
        if (['QR Code', 'Hotline', 'CC Desk'].includes(requestSource)) {
          groupedByDay[date][requestSource] += 1;
        } else {
          groupedByDay[date]['Other'] += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'QR Code',
        data: categories.map(date => groupedByDay[date]['QR Code'])
      },
      {
        name: 'Hotline',
        data: categories.map(date => groupedByDay[date]['Hotline'])
      },
      {
        name: 'CC Desk',
        data: categories.map(date => groupedByDay[date]['CC Desk'])
      },
      {
        name: 'Other',
        data: categories.map(date => groupedByDay[date]['Other'])
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyRequestSourceData(data: any[]) {
    // Group by week and request source
    const groupedByWeek: Record<string, { 'QR Code': number, 'Hotline': number, 'CC Desk': number, 'Other': number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { 'QR Code': 0, 'Hotline': 0, 'CC Desk': 0, 'Other': 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const requestSource = item.metadata?.request_source || 'Other';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { 'QR Code': 0, 'Hotline': 0, 'CC Desk': 0, 'Other': 0 };
        }
        
        if (['QR Code', 'Hotline', 'CC Desk'].includes(requestSource)) {
          groupedByWeek[weekLabel][requestSource] += 1;
        } else {
          groupedByWeek[weekLabel]['Other'] += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'QR Code',
        data: categories.map(week => groupedByWeek[week]['QR Code'])
      },
      {
        name: 'Hotline',
        data: categories.map(week => groupedByWeek[week]['Hotline'])
      },
      {
        name: 'CC Desk',
        data: categories.map(week => groupedByWeek[week]['CC Desk'])
      },
      {
        name: 'Other',
        data: categories.map(week => groupedByWeek[week]['Other'])
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyRequestSourceData(data: any[]) {
    // Group by month and request source
    const groupedByMonth: Record<string, { 'QR Code': number, 'Hotline': number, 'CC Desk': number, 'Other': number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { 'QR Code': 0, 'Hotline': 0, 'CC Desk': 0, 'Other': 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const requestSource = item.metadata?.request_source || 'Other';
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { 'QR Code': 0, 'Hotline': 0, 'CC Desk': 0, 'Other': 0 };
        }
        
        if (['QR Code', 'Hotline', 'CC Desk'].includes(requestSource)) {
          groupedByMonth[monthLabel][requestSource] += 1;
        } else {
          groupedByMonth[monthLabel]['Other'] += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'QR Code',
        data: categories.map(month => groupedByMonth[month]['QR Code'])
      },
      {
        name: 'Hotline',
        data: categories.map(month => groupedByMonth[month]['Hotline'])
      },
      {
        name: 'CC Desk',
        data: categories.map(month => groupedByMonth[month]['CC Desk'])
      },
      {
        name: 'Other',
        data: categories.map(month => groupedByMonth[month]['Other'])
      }
    ];
    
    return {
      categories,
      series
    };
  }

  async getNotReturnedItemsCount() {
    try {
      // Build the query for items not returned without filtration
      const query: any = {
        bool: {
          must: [
            { match: { 'type.keyword': 'Power Bank Request' } },
            { match: { 'state.keyword': 'Item Not Returned' } }
          ]
        }
      };

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 0, // We only need the count, not the documents
          track_total_hits: true // Ensure we get the total count
        }
      });

      // Get the total count
      let totalCount: number;
      if (typeof result.body.hits.total === 'number') {
        totalCount = result.body.hits.total;
      } else {
        totalCount = result.body.hits.total.value;
      }

      return {
        success: true,
        data: {
          count: totalCount
        }
      };
    } catch (error) {
      console.error('Error getting not returned items count:', error);
      return {
        success: false,
        message: 'Error getting not returned items count',
        error: error.message || error
      };
    }
  }
} 