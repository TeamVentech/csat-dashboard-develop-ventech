import { Injectable } from '@nestjs/common';
import { ElasticService } from '../../ElasticSearch/elasticsearch.service';
import * as moment from 'moment';
import { filter } from 'rxjs';

@Injectable()
export class WheelchairStrollerStatisticsService {
  constructor(private readonly elasticSearchService: ElasticService) {}

  async getWheelchairStrollerChartData(filters: {
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
            { match: { 'type.keyword': 'Wheelchair & Stroller Request' } }
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
      const chartData = this.processWheelchairStrollerChartData(hits, filters.period, filters.fromDate, filters.toDate);
      
      return {
        success: true,
        data: {
          wheelchairStrollerData: chartData
        }
      };
    } catch (error) {
      console.error('Error generating wheelchair/stroller chart data:', error);
      return {
        success: false,
        message: 'Error generating wheelchair/stroller chart data',
        error: error.message || error
      };
    }
  }

  private processWheelchairStrollerChartData(data: any[], periodType: string = 'Monthly', fromDate?: string, toDate?: string) {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyData(data, fromDate, toDate);
        break;
      case 'Weekly':
        processedData = this.processWeeklyData(data, fromDate, toDate);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyData(data, fromDate, toDate);
        break;
    }
    
    return processedData;
  }

  private processDailyData(data: any[], fromDate?: string, toDate?: string) {
    // Group by day and type (Wheelchair or Stroller)
    const groupedByDay: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate) : moment().subtract(30, 'days');
    const endDate = toDate ? moment(toDate) : moment();
    
    // Calculate days difference between start and end dates
    const daysDiff = endDate.diff(startDate, 'days') + 1; // +1 to include the end date
    
    // Initialize days based on date range
    for (let i = 0; i < daysDiff; i++) {
      const date = moment(startDate).add(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(moment(item.createdAt).format('YYYY-MM-DD')).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (groupedByDay[date]) {
        if (type === 'Wheelchair') {
          groupedByDay[date].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByDay[date].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(date => groupedByDay[date].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(date => groupedByDay[date].Stroller)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyData(data: any[], fromDate?: string, toDate?: string) {
    // Group by week and type (Wheelchair or Stroller)
    const groupedByWeek: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate).startOf('week') : moment().subtract(12, 'weeks').startOf('week');
    const endDate = toDate ? moment(toDate).endOf('week') : moment().endOf('week');
    
    // Calculate weeks difference
    let currentWeekStart = moment(startDate);
    
    // Initialize weeks based on date range
    while (currentWeekStart.isSameOrBefore(endDate)) {
      const weekLabel = `${currentWeekStart.format('MMM DD')} - ${moment(currentWeekStart).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { Wheelchair: 0, Stroller: 0 };
      currentWeekStart.add(1, 'week');
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(moment(item.createdAt).format('YYYY-MM-DD'));
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (groupedByWeek[weekLabel]) {
        if (type === 'Wheelchair') {
          groupedByWeek[weekLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByWeek[weekLabel].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(week => groupedByWeek[week].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(week => groupedByWeek[week].Stroller)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyData(data: any[], fromDate?: string, toDate?: string) {
    // Group by month and type (Wheelchair or Stroller)
    const groupedByMonth: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate).startOf('month') : moment().subtract(12, 'months').startOf('month');
    const endDate = toDate ? moment(toDate).endOf('month') : moment().endOf('month');
    
    // Calculate months difference
    let currentMonth = moment(startDate);
    
    // Initialize months based on date range
    while (currentMonth.isSameOrBefore(endDate, 'month')) {
      const monthLabel = currentMonth.format('MMM YYYY');
      groupedByMonth[monthLabel] = { Wheelchair: 0, Stroller: 0 };
      currentMonth.add(1, 'month');
    }
    
    // Group data
    data.forEach(item => {
      const normalizedDate = moment(moment(item.createdAt).format('YYYY-MM-DD'));
      const monthLabel = normalizedDate.format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (groupedByMonth[monthLabel]) {
        if (type === 'Wheelchair') {
          groupedByMonth[monthLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByMonth[monthLabel].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(month => groupedByMonth[month].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(month => groupedByMonth[month].Stroller)
      }
    ];
    
    return {
      categories,
      series
    };
  }
  /////////////////////////////
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
            { match: { 'type.keyword': 'Wheelchair & Stroller Request' } },
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

      // Also make sure metadata.type exists (either Wheelchair or Stroller)
      query.bool.filter.push({
        exists: { field: 'metadata.type' }
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
        item.metadata.returnDate && 
        item.metadata.returnTime &&
        item.metadata.type &&
        (item.metadata.type === 'Wheelchair' || item.metadata.type === 'Stroller') &&
        item.createdAt
      );
      
      // Check duration calculations
      const validDurations = validData.filter(item => this.calculateDurationInMinutes(item) !== null);
      
      // Process data for chart based on the period type
      const durationData = this.processAverageDurationData(validDurations, filters.period, filters.fromDate, filters.toDate);
      
      return {
        success: true,
        data: {
          wheelchairStrollerStats: {
            categories: durationData.categories,
            series: durationData.series,
            description: "This chart shows both the average duration in minutes and the count of requests for wheelchair and stroller services"
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

  private calculateDurationInMinutes(item: any): number {
    try {
      const returnDate = item.metadata.returnDate;
      const returnTime = item.metadata.returnTime;
      
      // Combine return date and time
      const returnDateTime = moment(`${returnDate} ${returnTime}`, 'YYYY-MM-DD HH:mm');
      const startMomentTime = moment(item.createdAt, 'YYYY-MM-DD HH:mm');
      
      // Calculate duration in minutes
      const durationMinutes = returnDateTime.diff(startMomentTime, 'minutes');
      console.log(`durationMinutes: ${durationMinutes} returnDateTime: ${returnDateTime} startMomentTime: ${startMomentTime}`);

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
  private processAverageDurationData(data: any[], periodType: string = 'Monthly', fromDate?: string, toDate?: string) {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyDurationData(data, fromDate, toDate);
        break;
      case 'Weekly':
        processedData = this.processWeeklyDurationData(data, fromDate, toDate);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyDurationData(data, fromDate, toDate);
        break;
    }
    
    return processedData;
  }

  private processDailyDurationData(data: any[], fromDate?: string, toDate?: string) {
    // Group by day and type (Wheelchair or Stroller)
    const groupedByDay: Record<string, { 
      Wheelchair: { totalDuration: number, count: number },
      Stroller: { totalDuration: number, count: number }
    }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate) : moment().subtract(30, 'days');
    const endDate = toDate ? moment(toDate) : moment();
    
    // Calculate days difference between start and end dates
    const daysDiff = endDate.diff(startDate, 'days') + 1; // +1 to include the end date
    
    // Initialize days based on date range
    for (let i = 0; i < daysDiff; i++) {
      const date = moment(startDate).add(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { 
        Wheelchair: { totalDuration: 0, count: 0 },
        Stroller: { totalDuration: 0, count: 0 }
      };
    }
    
    // Group data
    data.forEach(item => {
      // Normalize date without timezone to avoid timezone issues
      const date = moment(moment(item.createdAt).format('YYYY-MM-DD')).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      const durationMinutes = this.calculateDurationInMinutes(item);
      console.log(JSON.stringify(item));
      // Always include the duration value, even if it's 0
      const actualDuration = durationMinutes !== null ? durationMinutes : 0;
      
      if (groupedByDay[date]) {
        if (type === 'Wheelchair') {
          groupedByDay[date].Wheelchair.totalDuration += actualDuration;
          groupedByDay[date].Wheelchair.count += 1;
        } else if (type === 'Stroller') {
          groupedByDay[date].Stroller.totalDuration += actualDuration;
          groupedByDay[date].Stroller.count += 1;
        }
      }
    });
    
    // Calculate averages and format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Wheelchair - Average Duration (minutes)',
        data: categories.map(date => {
          const group = groupedByDay[date].Wheelchair;
          return group.count > 0 ? parseFloat((group.totalDuration / group.count).toFixed(1)) : 0;
        })
      },
      {
        name: 'Stroller - Average Duration (minutes)',
        data: categories.map(date => {
          const group = groupedByDay[date].Stroller;
          return group.count > 0 ? parseFloat((group.totalDuration / group.count).toFixed(1)) : 0;
        })
      },
      {
        name: 'Wheelchair - Request Count',
        data: categories.map(date => groupedByDay[date].Wheelchair.count)
      },
      {
        name: 'Stroller - Request Count',
        data: categories.map(date => groupedByDay[date].Stroller.count)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyDurationData(data: any[], fromDate?: string, toDate?: string) {
    // Group by week and type (Wheelchair or Stroller)
    const groupedByWeek: Record<string, { 
      Wheelchair: { totalDuration: number, count: number },
      Stroller: { totalDuration: number, count: number }
    }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate).startOf('week') : moment().subtract(12, 'weeks').startOf('week');
    const endDate = toDate ? moment(toDate).endOf('week') : moment().endOf('week');
    
    // Calculate weeks difference
    let currentWeekStart = moment(startDate);
    
    // Initialize weeks based on date range
    while (currentWeekStart.isSameOrBefore(endDate)) {
      const weekLabel = `${currentWeekStart.format('MMM DD')} - ${moment(currentWeekStart).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { 
        Wheelchair: { totalDuration: 0, count: 0 },
        Stroller: { totalDuration: 0, count: 0 }
      };
      currentWeekStart.add(1, 'week');
    }
    
    // Group data
    data.forEach(item => {
      // Parse createdAt consistently, stripping timezone info to prevent timezone-based grouping issues
      const itemDate = moment(moment(item.createdAt).format('YYYY-MM-DD HH:mm'));
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      const durationMinutes = this.calculateDurationInMinutes(item);
      
      // Always include the duration value, even if it's 0
      const actualDuration = durationMinutes !== null ? durationMinutes : 0;
      
      // Check if the week label exists in our pre-initialized weeks
      if (groupedByWeek[weekLabel]) {
        if (type === 'Wheelchair') {
          groupedByWeek[weekLabel].Wheelchair.totalDuration += actualDuration;
          groupedByWeek[weekLabel].Wheelchair.count += 1;
        } else if (type === 'Stroller') {
          groupedByWeek[weekLabel].Stroller.totalDuration += actualDuration;
          groupedByWeek[weekLabel].Stroller.count += 1;
        }
      }
    });
    
    // Calculate averages and format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Wheelchair - Average Duration (minutes)',
        data: categories.map(week => {
          const group = groupedByWeek[week].Wheelchair;
          return group.count > 0 ? parseFloat((group.totalDuration / group.count).toFixed(1)) : 0;
        })
      },
      {
        name: 'Stroller - Average Duration (minutes)',
        data: categories.map(week => {
          const group = groupedByWeek[week].Stroller;
          return group.count > 0 ? parseFloat((group.totalDuration / group.count).toFixed(1)) : 0;
        })
      },
      {
        name: 'Wheelchair - Request Count',
        data: categories.map(week => groupedByWeek[week].Wheelchair.count)
      },
      {
        name: 'Stroller - Request Count',
        data: categories.map(week => groupedByWeek[week].Stroller.count)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyDurationData(data: any[], fromDate?: string, toDate?: string) {
    // Group by month and type (Wheelchair or Stroller)
    const groupedByMonth: Record<string, { 
      Wheelchair: { totalDuration: number, count: number },
      Stroller: { totalDuration: number, count: number }
    }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate).startOf('month') : moment().subtract(12, 'months').startOf('month');
    const endDate = toDate ? moment(toDate).endOf('month') : moment().endOf('month');
    
    // Calculate months difference
    let currentMonth = moment(startDate);
    
    // Initialize months based on date range
    while (currentMonth.isSameOrBefore(endDate, 'month')) {
      const monthLabel = currentMonth.format('MMM YYYY');
      groupedByMonth[monthLabel] = { 
        Wheelchair: { totalDuration: 0, count: 0 },
        Stroller: { totalDuration: 0, count: 0 }
      };
      currentMonth.add(1, 'month');
    }
    
    // Group data
    data.forEach(item => {
      // Normalize date without timezone to avoid timezone issues
      const normalizedDate = moment(moment(item.createdAt).format('YYYY-MM-DD'));
      const monthLabel = normalizedDate.format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      const durationMinutes = this.calculateDurationInMinutes(item);
      console.log(JSON.stringify(item));

      // Always include the duration value, even if it's 0
      const actualDuration = durationMinutes !== null ? durationMinutes : 0;
      
      if (groupedByMonth[monthLabel]) {
        if (type === 'Wheelchair') {
          groupedByMonth[monthLabel].Wheelchair.totalDuration += actualDuration;
          groupedByMonth[monthLabel].Wheelchair.count += 1;
        } else if (type === 'Stroller') {
          groupedByMonth[monthLabel].Stroller.totalDuration += actualDuration;
          groupedByMonth[monthLabel].Stroller.count += 1;
        }
      }
    });
    
    // Calculate averages and format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Wheelchair - Average Duration (minutes)',
        data: categories.map(month => {
          const group = groupedByMonth[month].Wheelchair;
          return group.count > 0 ? parseFloat((group.totalDuration / group.count).toFixed(1)) : 0;
        })
      },
      {
        name: 'Stroller - Average Duration (minutes)',
        data: categories.map(month => {
          const group = groupedByMonth[month].Stroller;
          return group.count > 0 ? parseFloat((group.totalDuration / group.count).toFixed(1)) : 0;
        })
      },
      {
        name: 'Wheelchair - Request Count',
        data: categories.map(month => groupedByMonth[month].Wheelchair.count)
      },
      {
        name: 'Stroller - Request Count',
        data: categories.map(month => groupedByMonth[month].Stroller.count)
      }
    ];
    
    return {
      categories,
      series
    };
  }
////////////////

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
            { match: { 'type.keyword': 'Wheelchair & Stroller Request' } },
            { match: { 'state.keyword': 'Item Returned' } },
            { match: { 'metadata.condition.keyword': 'Damaged' } }
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

      // Must have damage details
      query.bool.filter.push({
        exists: { field: 'metadata.damageDetails' }
      });

      // Also make sure metadata.type exists (either Wheelchair or Stroller)
      query.bool.filter.push({
        exists: { field: 'metadata.type' }
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
        item.metadata.condition === 'Damaged' &&
        item.metadata.damageDetails &&
        item.metadata.type &&
        (item.metadata.type === 'Wheelchair' || item.metadata.type === 'Stroller') &&
        item.createdAt
      );
      
      // Process data for chart based on the period type
      const chartData = this.processDamagedCasesData(validData, filters.period, filters.fromDate, filters.toDate);
      
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
            { match: { 'type.keyword': 'Wheelchair & Stroller Request' } },
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

      // Also make sure metadata.type exists (either Wheelchair or Stroller)
      query.bool.filter.push({
        exists: { field: 'metadata.type' }
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
        item.metadata.type &&
        (item.metadata.type === 'Wheelchair' || item.metadata.type === 'Stroller') &&
        item.createdAt
      );
      
      // Process data for chart based on the period type
      const chartData = this.processNotReturnedItemsData(validData, filters.period, filters.fromDate, filters.toDate);
      
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

  async getDeliveryPickupServicesData(filter) {
    try {
      // Build the query
      const filters = filter.params;
      const query: any = {
        bool: {
          must: [
            { match: { 'type.keyword': 'Wheelchair & Stroller Request' } }
          ],
          should: [
            { match: { 'metadata.delivery': true } },
            { match: { 'metadata.pickUp': true } }
          ],
          minimum_should_match: 1,
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

      // Also make sure metadata.type exists (either Wheelchair or Stroller)
      query.bool.filter.push({
        exists: { field: 'metadata.type' }
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
        item.metadata.type &&
        (item.metadata.type === 'Wheelchair' || item.metadata.type === 'Stroller') &&
        (item.metadata.delivery === true || item.metadata.pickUp === true) &&
        item.createdAt
      );
      
      // Process data for chart based on the period type
      const chartData = this.processDeliveryPickupServicesData(validData, filters.period, filters.fromDate, filters.toDate);
      
      // Create the table data
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

  private processDeliveryPickupServicesData(data: any[], periodType: string = 'Monthly', fromDate?: string, toDate?: string) {
    let processedData: any;
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyDeliveryPickupServicesData(data, fromDate, toDate);
        break;
      case 'Weekly':
        processedData = this.processWeeklyDeliveryPickupServicesData(data, fromDate, toDate);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyDeliveryPickupServicesData(data, fromDate, toDate);
        break;
    }
    
    return processedData;
  }

  private processDailyDeliveryPickupServicesData(data: any[], fromDate?: string, toDate?: string) {
    // Group by day
    const groupedByDay: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate) : moment().subtract(30, 'days');
    const endDate = toDate ? moment(toDate) : moment();
    
    // Calculate days difference between start and end dates
    const daysDiff = endDate.diff(startDate, 'days') + 1; // +1 to include the end date
    
    // Initialize days based on date range
    for (let i = 0; i < daysDiff; i++) {
      const date = moment(startDate).add(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(moment(item.createdAt).format('YYYY-MM-DD')).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (groupedByDay[date]) {
        if (type === 'Wheelchair') {
          groupedByDay[date].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByDay[date].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(date => groupedByDay[date].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(date => groupedByDay[date].Stroller)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyDeliveryPickupServicesData(data: any[], fromDate?: string, toDate?: string) {
    // Group by week
    const groupedByWeek: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate).startOf('week') : moment().subtract(12, 'weeks').startOf('week');
    const endDate = toDate ? moment(toDate).endOf('week') : moment().endOf('week');
    
    // Calculate weeks difference
    let currentWeekStart = moment(startDate);
    
    // Initialize weeks based on date range
    while (currentWeekStart.isSameOrBefore(endDate)) {
      const weekLabel = `${currentWeekStart.format('MMM DD')} - ${moment(currentWeekStart).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { Wheelchair: 0, Stroller: 0 };
      currentWeekStart.add(1, 'week');
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(moment(item.createdAt).format('YYYY-MM-DD'));
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (groupedByWeek[weekLabel]) {
        if (type === 'Wheelchair') {
          groupedByWeek[weekLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByWeek[weekLabel].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(week => groupedByWeek[week].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(week => groupedByWeek[week].Stroller)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyDeliveryPickupServicesData(data: any[], fromDate?: string, toDate?: string) {
    // Group by month
    const groupedByMonth: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate).startOf('month') : moment().subtract(12, 'months').startOf('month');
    const endDate = toDate ? moment(toDate).endOf('month') : moment().endOf('month');
    
    // Calculate months difference
    let currentMonth = moment(startDate);
    
    // Initialize months based on date range
    while (currentMonth.isSameOrBefore(endDate, 'month')) {
      const monthLabel = currentMonth.format('MMM YYYY');
      groupedByMonth[monthLabel] = { Wheelchair: 0, Stroller: 0 };
      currentMonth.add(1, 'month');
    }
    
    // Group data
    data.forEach(item => {
      const normalizedDate = moment(moment(item.createdAt).format('YYYY-MM-DD'));
      const monthLabel = normalizedDate.format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (groupedByMonth[monthLabel]) {
        if (type === 'Wheelchair') {
          groupedByMonth[monthLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByMonth[monthLabel].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(month => groupedByMonth[month].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(month => groupedByMonth[month].Stroller)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private calculateDeliveryPickupStats(data: any[]) {
    const stats = {
      totalCount: data.length,
      deliveryOnlyCount: 0,
      pickupOnlyCount: 0,
      bothDeliveryAndPickupCount: 0,
      wheelchairCount: 0,
      strollerCount: 0,
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
      if (type === 'Wheelchair') {
        stats.wheelchairCount++;
      } else if (type === 'Stroller') {
        stats.strollerCount++;
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


  private processDamagedCasesData(data: any[], periodType: string = 'Monthly', fromDate?: string, toDate?: string) {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyDamagedCasesData(data, fromDate, toDate);
        break;
      case 'Weekly':
        processedData = this.processWeeklyDamagedCasesData(data, fromDate, toDate);
        break;
      case 'Time of Day':
        processedData = this.processTimeOfDayDamagedCasesData(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyDamagedCasesData(data, fromDate, toDate);
        break;
    }
    
    return processedData;
  }

  private processDailyDamagedCasesData(data: any[], fromDate?: string, toDate?: string) {
    // Group by day
    const groupedByDay: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { Wheelchair: 0, Stroller: 0 };
        }
        
        if (type === 'Wheelchair') {
          groupedByDay[date].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByDay[date].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(date => groupedByDay[date].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(date => groupedByDay[date].Stroller)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyDamagedCasesData(data: any[], fromDate?: string, toDate?: string) {
    // Group by week
    const groupedByWeek: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { Wheelchair: 0, Stroller: 0 };
        }
        
        if (type === 'Wheelchair') {
          groupedByWeek[weekLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByWeek[weekLabel].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(week => groupedByWeek[week].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(week => groupedByWeek[week].Stroller)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyDamagedCasesData(data: any[], fromDate?: string, toDate?: string) {
    // Group by month
    const groupedByMonth: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate).startOf('month') : moment().subtract(12, 'months').startOf('month');
    const endDate = toDate ? moment(toDate).endOf('month') : moment().endOf('month');
    
    // Calculate months difference
    let currentMonth = moment(startDate);
    
    // Initialize months based on date range
    while (currentMonth.isSameOrBefore(endDate, 'month')) {
      const monthLabel = currentMonth.format('MMM YYYY');
      groupedByMonth[monthLabel] = { Wheelchair: 0, Stroller: 0 };
      currentMonth.add(1, 'month');
    }
    
    // Group data
    data.forEach(item => {
      const normalizedDate = moment(moment(item.createdAt).format('YYYY-MM-DD'));
      const monthLabel = normalizedDate.format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (groupedByMonth[monthLabel]) {
        if (type === 'Wheelchair') {
          groupedByMonth[monthLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByMonth[monthLabel].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(month => groupedByMonth[month].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(month => groupedByMonth[month].Stroller)
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
    
    const groupedByTime: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize time slots
    timeSlots.forEach(slot => {
      groupedByTime[slot.label] = { Wheelchair: 0, Stroller: 0 };
    });
    
    // Group data
    data.forEach(item => {
      const hour = moment(item.createdAt).hour();
      const type = item.metadata?.type || 'Unknown';
      
      const timeSlot = timeSlots.find(slot => hour >= slot.start && hour <= slot.end);
      
      if (timeSlot) {
        if (type === 'Wheelchair') {
          groupedByTime[timeSlot.label].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByTime[timeSlot.label].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = timeSlots.map(slot => slot.label);
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(time => groupedByTime[time].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(time => groupedByTime[time].Stroller)
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
    const groupedByDay: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { Wheelchair: 0, Stroller: 0 };
        }
        
        if (type === 'Wheelchair') {
          groupedByDay[date].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByDay[date].Stroller += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `Gender: ${filters.gender}` : '';
    
    return Object.keys(groupedByDay)
      .sort((a, b) => moment(a).diff(moment(b)))
      .filter(date => groupedByDay[date].Wheelchair > 0 || groupedByDay[date].Stroller > 0)
      .map(date => ({
        period: date,
        wheelchairCount: groupedByDay[date].Wheelchair,
        strollerCount: groupedByDay[date].Stroller,
        totalCount: groupedByDay[date].Wheelchair + groupedByDay[date].Stroller,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private createWeeklyDamagedCasesTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by week
    const groupedByWeek: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { Wheelchair: 0, Stroller: 0 };
        }
        
        if (type === 'Wheelchair') {
          groupedByWeek[weekLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByWeek[weekLabel].Stroller += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `Gender: ${filters.gender}` : '';
    
    return Object.keys(groupedByWeek)
      .filter(week => groupedByWeek[week].Wheelchair > 0 || groupedByWeek[week].Stroller > 0)
      .map(week => ({
        period: week,
        wheelchairCount: groupedByWeek[week].Wheelchair,
        strollerCount: groupedByWeek[week].Stroller,
        totalCount: groupedByWeek[week].Wheelchair + groupedByWeek[week].Stroller,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private createMonthlyDamagedCasesTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by month
    const groupedByMonth: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { Wheelchair: 0, Stroller: 0 };
        }
        
        if (type === 'Wheelchair') {
          groupedByMonth[monthLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByMonth[monthLabel].Stroller += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `Gender: ${filters.gender}` : '';
    
    return Object.keys(groupedByMonth)
      .filter(month => groupedByMonth[month].Wheelchair > 0 || groupedByMonth[month].Stroller > 0)
      .map(month => ({
        period: month,
        wheelchairCount: groupedByMonth[month].Wheelchair,
        strollerCount: groupedByMonth[month].Stroller,
        totalCount: groupedByMonth[month].Wheelchair + groupedByMonth[month].Stroller,
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
    
    const groupedByTime: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize time slots
    timeSlots.forEach(slot => {
      groupedByTime[slot.label] = { Wheelchair: 0, Stroller: 0 };
    });
    
    // Group data
    data.forEach(item => {
      const hour = moment(item.createdAt).hour();
      const type = item.metadata?.type || 'Unknown';
      
      const timeSlot = timeSlots.find(slot => hour >= slot.start && hour <= slot.end);
      
      if (timeSlot) {
        if (type === 'Wheelchair') {
          groupedByTime[timeSlot.label].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByTime[timeSlot.label].Stroller += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return timeSlots
      .map(slot => slot.label)
      .filter(time => groupedByTime[time].Wheelchair > 0 || groupedByTime[time].Stroller > 0)
      .map(time => ({
        period: time,
        wheelchairCount: groupedByTime[time].Wheelchair,
        strollerCount: groupedByTime[time].Stroller,
        totalCount: groupedByTime[time].Wheelchair + groupedByTime[time].Stroller,
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

  private processNotReturnedItemsData(data: any[], periodType: string = 'Monthly', fromDate?: string, toDate?: string) {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyNotReturnedItemsData(data, fromDate, toDate);
        break;
      case 'Weekly':
        processedData = this.processWeeklyNotReturnedItemsData(data, fromDate, toDate);
        break;
      case 'Time of Day':
        processedData = this.processTimeOfDayNotReturnedItemsData(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyNotReturnedItemsData(data, fromDate, toDate);
        break;
    }
    
    return processedData;
  }

  private processDailyNotReturnedItemsData(data: any[], fromDate?: string, toDate?: string) {
    // Group by day
    const groupedByDay: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { Wheelchair: 0, Stroller: 0 };
        }
        
        if (type === 'Wheelchair') {
          groupedByDay[date].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByDay[date].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(date => groupedByDay[date].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(date => groupedByDay[date].Stroller)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyNotReturnedItemsData(data: any[], fromDate?: string, toDate?: string) {
    // Group by week
    const groupedByWeek: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { Wheelchair: 0, Stroller: 0 };
        }
        
        if (type === 'Wheelchair') {
          groupedByWeek[weekLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByWeek[weekLabel].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(week => groupedByWeek[week].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(week => groupedByWeek[week].Stroller)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyNotReturnedItemsData(data: any[], fromDate?: string, toDate?: string) {
    // Group by month
    const groupedByMonth: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate).startOf('month') : moment().subtract(12, 'months').startOf('month');
    const endDate = toDate ? moment(toDate).endOf('month') : moment().endOf('month');
    
    // Calculate months difference
    let currentMonth = moment(startDate);
    
    // Initialize months based on date range
    while (currentMonth.isSameOrBefore(endDate, 'month')) {
      const monthLabel = currentMonth.format('MMM YYYY');
      groupedByMonth[monthLabel] = { Wheelchair: 0, Stroller: 0 };
      currentMonth.add(1, 'month');
    }
    
    // Group data
    data.forEach(item => {
      const normalizedDate = moment(moment(item.createdAt).format('YYYY-MM-DD'));
      const monthLabel = normalizedDate.format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (groupedByMonth[monthLabel]) {
        if (type === 'Wheelchair') {
          groupedByMonth[monthLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByMonth[monthLabel].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(month => groupedByMonth[month].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(month => groupedByMonth[month].Stroller)
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
    
    const groupedByTime: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize time slots
    timeSlots.forEach(slot => {
      groupedByTime[slot.label] = { Wheelchair: 0, Stroller: 0 };
    });
    
    // Group data
    data.forEach(item => {
      const hour = moment(item.createdAt).hour();
      const type = item.metadata?.type || 'Unknown';
      
      const timeSlot = timeSlots.find(slot => hour >= slot.start && hour <= slot.end);
      
      if (timeSlot) {
        if (type === 'Wheelchair') {
          groupedByTime[timeSlot.label].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByTime[timeSlot.label].Stroller += 1;
        }
      }
    });
    
    // Format for chart
    const categories = timeSlots.map(slot => slot.label);
    const series = [
      {
        name: 'Wheelchair',
        data: categories.map(time => groupedByTime[time].Wheelchair)
      },
      {
        name: 'Stroller',
        data: categories.map(time => groupedByTime[time].Stroller)
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
    const groupedByDay: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { Wheelchair: 0, Stroller: 0 };
        }
        
        if (type === 'Wheelchair') {
          groupedByDay[date].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByDay[date].Stroller += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return Object.keys(groupedByDay)
      .sort((a, b) => moment(a).diff(moment(b)))
      .filter(date => groupedByDay[date].Wheelchair > 0 || groupedByDay[date].Stroller > 0)
      .map(date => ({
        period: date,
        wheelchairCount: groupedByDay[date].Wheelchair,
        strollerCount: groupedByDay[date].Stroller,
        totalCount: groupedByDay[date].Wheelchair + groupedByDay[date].Stroller,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private createWeeklyNotReturnedItemsTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by week
    const groupedByWeek: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { Wheelchair: 0, Stroller: 0 };
        }
        
        if (type === 'Wheelchair') {
          groupedByWeek[weekLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByWeek[weekLabel].Stroller += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return Object.keys(groupedByWeek)
      .filter(week => groupedByWeek[week].Wheelchair > 0 || groupedByWeek[week].Stroller > 0)
      .map(week => ({
        period: week,
        wheelchairCount: groupedByWeek[week].Wheelchair,
        strollerCount: groupedByWeek[week].Stroller,
        totalCount: groupedByWeek[week].Wheelchair + groupedByWeek[week].Stroller,
        ageRange: ageRangeText,
        gender: genderText
      }));
  }

  private createMonthlyNotReturnedItemsTableData(data: any[], filters: { minAge?: number, maxAge?: number, gender?: string } = {}) {
    // Group by month
    const groupedByMonth: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { Wheelchair: 0, Stroller: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { Wheelchair: 0, Stroller: 0 };
        }
        
        if (type === 'Wheelchair') {
          groupedByMonth[monthLabel].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByMonth[monthLabel].Stroller += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return Object.keys(groupedByMonth)
      .filter(month => groupedByMonth[month].Wheelchair > 0 || groupedByMonth[month].Stroller > 0)
      .map(month => ({
        period: month,
        wheelchairCount: groupedByMonth[month].Wheelchair,
        strollerCount: groupedByMonth[month].Stroller,
        totalCount: groupedByMonth[month].Wheelchair + groupedByMonth[month].Stroller,
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
    
    const groupedByTime: Record<string, { Wheelchair: number, Stroller: number }> = {};
    
    // Initialize time slots
    timeSlots.forEach(slot => {
      groupedByTime[slot.label] = { Wheelchair: 0, Stroller: 0 };
    });
    
    // Group data
    data.forEach(item => {
      const hour = moment(item.createdAt).hour();
      const type = item.metadata?.type || 'Unknown';
      
      const timeSlot = timeSlots.find(slot => hour >= slot.start && hour <= slot.end);
      
      if (timeSlot) {
        if (type === 'Wheelchair') {
          groupedByTime[timeSlot.label].Wheelchair += 1;
        } else if (type === 'Stroller') {
          groupedByTime[timeSlot.label].Stroller += 1;
        }
      }
    });
    
    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    
    return timeSlots
      .map(slot => slot.label)
      .filter(time => groupedByTime[time].Wheelchair > 0 || groupedByTime[time].Stroller > 0)
      .map(time => ({
        period: time,
        wheelchairCount: groupedByTime[time].Wheelchair,
        strollerCount: groupedByTime[time].Stroller,
        totalCount: groupedByTime[time].Wheelchair + groupedByTime[time].Stroller,
        ageRange: ageRangeText,
        gender: genderText
      }));
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
      Wheelchair: { delivery: number, pickup: number, both: number, total: number },
      Stroller: { delivery: number, pickup: number, both: number, total: number }
    }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { 
        Wheelchair: { delivery: 0, pickup: 0, both: 0, total: 0 },
        Stroller: { delivery: 0, pickup: 0, both: 0, total: 0 }
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
            Wheelchair: { delivery: 0, pickup: 0, both: 0, total: 0 },
            Stroller: { delivery: 0, pickup: 0, both: 0, total: 0 }
          };
        }
        
        if (type === 'Wheelchair') {
          if (hasDelivery && hasPickup) {
            groupedByDay[date].Wheelchair.both += 1;
          } else if (hasDelivery) {
            groupedByDay[date].Wheelchair.delivery += 1;
          } else if (hasPickup) {
            groupedByDay[date].Wheelchair.pickup += 1;
          }
          groupedByDay[date].Wheelchair.total += 1;
        } else if (type === 'Stroller') {
          if (hasDelivery && hasPickup) {
            groupedByDay[date].Stroller.both += 1;
          } else if (hasDelivery) {
            groupedByDay[date].Stroller.delivery += 1;
          } else if (hasPickup) {
            groupedByDay[date].Stroller.pickup += 1;
          }
          groupedByDay[date].Stroller.total += 1;
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
        return day.Wheelchair.total > 0 || day.Stroller.total > 0;
      })
      .map(date => {
        const day = groupedByDay[date];
        return {
          period: date,
          wheelchair: {
            deliveryOnly: day.Wheelchair.delivery,
            pickupOnly: day.Wheelchair.pickup,
            both: day.Wheelchair.both,
            total: day.Wheelchair.total
          },
          stroller: {
            deliveryOnly: day.Stroller.delivery,
            pickupOnly: day.Stroller.pickup,
            both: day.Stroller.both,
            total: day.Stroller.total
          },
          totalServices: day.Wheelchair.total + day.Stroller.total,
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
      Wheelchair: { delivery: number, pickup: number, both: number, total: number },
      Stroller: { delivery: number, pickup: number, both: number, total: number }
    }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { 
        Wheelchair: { delivery: 0, pickup: 0, both: 0, total: 0 },
        Stroller: { delivery: 0, pickup: 0, both: 0, total: 0 }
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
            Wheelchair: { delivery: 0, pickup: 0, both: 0, total: 0 },
            Stroller: { delivery: 0, pickup: 0, both: 0, total: 0 }
          };
        }
        
        if (type === 'Wheelchair') {
          if (hasDelivery && hasPickup) {
            groupedByWeek[weekLabel].Wheelchair.both += 1;
          } else if (hasDelivery) {
            groupedByWeek[weekLabel].Wheelchair.delivery += 1;
          } else if (hasPickup) {
            groupedByWeek[weekLabel].Wheelchair.pickup += 1;
          }
          groupedByWeek[weekLabel].Wheelchair.total += 1;
        } else if (type === 'Stroller') {
          if (hasDelivery && hasPickup) {
            groupedByWeek[weekLabel].Stroller.both += 1;
          } else if (hasDelivery) {
            groupedByWeek[weekLabel].Stroller.delivery += 1;
          } else if (hasPickup) {
            groupedByWeek[weekLabel].Stroller.pickup += 1;
          }
          groupedByWeek[weekLabel].Stroller.total += 1;
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
        return weekData.Wheelchair.total > 0 || weekData.Stroller.total > 0;
      })
      .map(week => {
        const weekData = groupedByWeek[week];
        return {
          period: week,
          wheelchair: {
            deliveryOnly: weekData.Wheelchair.delivery,
            pickupOnly: weekData.Wheelchair.pickup,
            both: weekData.Wheelchair.both,
            total: weekData.Wheelchair.total
          },
          stroller: {
            deliveryOnly: weekData.Stroller.delivery,
            pickupOnly: weekData.Stroller.pickup,
            both: weekData.Stroller.both,
            total: weekData.Stroller.total
          },
          totalServices: weekData.Wheelchair.total + weekData.Stroller.total,
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
      Wheelchair: { delivery: number, pickup: number, both: number, total: number },
      Stroller: { delivery: number, pickup: number, both: number, total: number }
    }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { 
        Wheelchair: { delivery: 0, pickup: 0, both: 0, total: 0 },
        Stroller: { delivery: 0, pickup: 0, both: 0, total: 0 }
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
            Wheelchair: { delivery: 0, pickup: 0, both: 0, total: 0 },
            Stroller: { delivery: 0, pickup: 0, both: 0, total: 0 }
          };
        }
        
        if (type === 'Wheelchair') {
          if (hasDelivery && hasPickup) {
            groupedByMonth[monthLabel].Wheelchair.both += 1;
          } else if (hasDelivery) {
            groupedByMonth[monthLabel].Wheelchair.delivery += 1;
          } else if (hasPickup) {
            groupedByMonth[monthLabel].Wheelchair.pickup += 1;
          }
          groupedByMonth[monthLabel].Wheelchair.total += 1;
        } else if (type === 'Stroller') {
          if (hasDelivery && hasPickup) {
            groupedByMonth[monthLabel].Stroller.both += 1;
          } else if (hasDelivery) {
            groupedByMonth[monthLabel].Stroller.delivery += 1;
          } else if (hasPickup) {
            groupedByMonth[monthLabel].Stroller.pickup += 1;
          }
          groupedByMonth[monthLabel].Stroller.total += 1;
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
        return monthData.Wheelchair.total > 0 || monthData.Stroller.total > 0;
      })
      .map(month => {
        const monthData = groupedByMonth[month];
        return {
          period: month,
          wheelchair: {
            deliveryOnly: monthData.Wheelchair.delivery,
            pickupOnly: monthData.Wheelchair.pickup,
            both: monthData.Wheelchair.both,
            total: monthData.Wheelchair.total
          },
          stroller: {
            deliveryOnly: monthData.Stroller.delivery,
            pickupOnly: monthData.Stroller.pickup,
            both: monthData.Stroller.both,
            total: monthData.Stroller.total
          },
          totalServices: monthData.Wheelchair.total + monthData.Stroller.total,
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
            { match: { 'type.keyword': 'Wheelchair & Stroller Request' } }
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
      const chartData = this.processRequestSourceReportData(validData, filters.period, filters.fromDate, filters.toDate);
      
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
      wheelchairCounts: {
        'QR Code': 0,
        'Hotline': 0,
        'CC Desk': 0,
        'Other': 0
      },
      strollerCounts: {
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
      if (type === 'Wheelchair') {
        summary.wheelchairCounts[sourceKey]++;
      } else if (type === 'Stroller') {
        summary.strollerCounts[sourceKey]++;
      }
    });

    return summary;
  }

  private processRequestSourceReportData(data: any[], periodType: string = 'Monthly', fromDate?: string, toDate?: string) {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyRequestSourceData(data, fromDate, toDate);
        break;
      case 'Weekly':
        processedData = this.processWeeklyRequestSourceData(data, fromDate, toDate);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyRequestSourceData(data, fromDate, toDate);
        break;
    }
    
    return processedData;
  }

  private processDailyRequestSourceData(data: any[], fromDate?: string, toDate?: string) {
    // Group by day and request source
    const groupedByDay: Record<string, { 'QR Code': number, 'Hotline': number, 'CC Desk': number, 'Other': number }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate) : moment().subtract(30, 'days');
    const endDate = toDate ? moment(toDate) : moment();
    
    // Calculate days difference between start and end dates
    const daysDiff = endDate.diff(startDate, 'days') + 1; // +1 to include the end date
    
    // Initialize days based on date range
    for (let i = 0; i < daysDiff; i++) {
      const date = moment(startDate).add(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { 'QR Code': 0, 'Hotline': 0, 'CC Desk': 0, 'Other': 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(moment(item.createdAt).format('YYYY-MM-DD')).format('YYYY-MM-DD');
      const requestSource = item.metadata?.request_source || 'Other';
      
      if (groupedByDay[date]) {
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
  
  private processWeeklyRequestSourceData(data: any[], fromDate?: string, toDate?: string) {
    // Group by week and request source
    const groupedByWeek: Record<string, { 'QR Code': number, 'Hotline': number, 'CC Desk': number, 'Other': number }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate).startOf('week') : moment().subtract(12, 'weeks').startOf('week');
    const endDate = toDate ? moment(toDate).endOf('week') : moment().endOf('week');
    
    // Calculate weeks difference
    let currentWeekStart = moment(startDate);
    
    // Initialize weeks based on date range
    while (currentWeekStart.isSameOrBefore(endDate)) {
      const weekLabel = `${currentWeekStart.format('MMM DD')} - ${moment(currentWeekStart).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { 'QR Code': 0, 'Hotline': 0, 'CC Desk': 0, 'Other': 0 };
      currentWeekStart.add(1, 'week');
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(moment(item.createdAt).format('YYYY-MM-DD'));
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const requestSource = item.metadata?.request_source || 'Other';
      
      if (groupedByWeek[weekLabel]) {
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
  
  private processMonthlyRequestSourceData(data: any[], fromDate?: string, toDate?: string) {
    // Group by month and request source
    const groupedByMonth: Record<string, { 'QR Code': number, 'Hotline': number, 'CC Desk': number, 'Other': number }> = {};
    
    // Parse fromDate and toDate, defaulting to appropriate values if not provided
    const startDate = fromDate ? moment(fromDate).startOf('month') : moment().subtract(12, 'months').startOf('month');
    const endDate = toDate ? moment(toDate).endOf('month') : moment().endOf('month');
    
    // Calculate months difference
    let currentMonth = moment(startDate);
    
    // Initialize months based on date range
    while (currentMonth.isSameOrBefore(endDate, 'month')) {
      const monthLabel = currentMonth.format('MMM YYYY');
      groupedByMonth[monthLabel] = { 'QR Code': 0, 'Hotline': 0, 'CC Desk': 0, 'Other': 0 };
      currentMonth.add(1, 'month');
    }
    
    // Group data
    data.forEach(item => {
      const normalizedDate = moment(moment(item.createdAt).format('YYYY-MM-DD'));
      const monthLabel = normalizedDate.format('MMM YYYY');
      const requestSource = item.metadata?.request_source || 'Other';
      
      if (groupedByMonth[monthLabel]) {
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
} 