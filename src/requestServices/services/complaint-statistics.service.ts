import { Injectable } from '@nestjs/common';
import { ElasticService } from '../../ElasticSearch/elasticsearch.service';
import * as moment from 'moment';
import { ComplaintChartDto } from 'requestServices/dto/complaints-chart.dto';

@Injectable()
export class ComplaintStatisticsService {
  constructor(private readonly elasticSearchService: ElasticService) {}

  async getComplaintChartData(filters: ComplaintChartDto) {
    try {
      // Build the query
      const query: any = {
        bool: {
          filter: []
        }
      };

      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'customer.age': {} } };
        if (filters.minAge) ageRange.range['customer.age'].gte = filters.minAge;
        if (filters.maxAge) ageRange.range['customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'customer.gender.keyword': filters.gender }
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
        index: 'complaints',
        body: {
          query,
          size: 10000 // Get all matching documents
        }
      });
      const hits = result.body.hits.hits.map((hit: any) => hit._source);
      
      // Process data for chart based on the period type
      const chartData = this.processComplaintChartData(hits, filters.period);
      
      return {
        success: true,
        data: {
          complaintData: chartData
        }
      };
    } catch (error) {
      console.error('Error generating complaint chart data:', error);
      return {
        success: false,
        message: 'Error generating complaint chart data',
        error: error.message || error
      };
    }
  }

  private processComplaintChartData(data: any[], periodType: string = 'Monthly') {
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
    const groupedByDay: Record<string, { Complaint: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { Complaint: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { Complaint: 0 };
        }
          groupedByDay[date].Complaint += 1;
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Complaint',
        data: categories.map(date => groupedByDay[date].Complaint)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyData(data: any[]) {
    // Group by week and type (Power Bank)
    const groupedByWeek: Record<string, { Complaint: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { Complaint: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
            groupedByWeek[weekLabel] = { Complaint: 0 };
        }
        
          groupedByWeek[weekLabel].Complaint += 1;
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Complaint',
        data: categories.map(week => groupedByWeek[week].Complaint)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyData(data: any[]) {
    // Group by month and type (Power Bank)
    const groupedByMonth: Record<string, { Complaint: number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { Complaint: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { Complaint: 0 };
        }
        
        groupedByMonth[monthLabel].Complaint += 1;
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Complaint',
        data: categories.map(month => groupedByMonth[month].Complaint)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  ////////////////////////////////////////////////////////////////

  async getComplaintChartDataFilter(filters: ComplaintChartDto) {
    try {
      // Build the query
      const query: any = {
        bool: {
          filter: []
        }
      };

      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'customer.age': {} } };
        if (filters.minAge) ageRange.range['customer.age'].gte = filters.minAge;
        if (filters.maxAge) ageRange.range['customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'customer.gender.keyword': filters.gender }
        });
      }

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { 'createdAt': {} } };
        if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        query.bool.filter.push(dateRange);
      }

      if (filters.touchpointId) {
        query.bool.filter.push({
          match: { 'touchpointId': filters.touchpointId }
        });
      }

      if (filters.categoryId) {
        query.bool.filter.push({
          match: { 'categoryId': filters.categoryId }
        });
      }

      if (filters.complaint_type) {
        query.bool.filter.push({
          match: { 'type.keyword': filters.complaint_type }
        });
      }

      if (filters.sectionsId) {
        query.bool.filter.push({
          nested: {
            path: "sections",
            query: {
              match: { "sections.id": filters.sectionsId }
            }
          }
        });
      }

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'complaints',
        body: {
          query,
          size: 10000 // Get all matching documents
        }
      });
      const hits = result.body.hits.hits.map((hit: any) => hit._source);
      
      // Process data for chart based on the period type
      const chartData = this.processComplaintChartDataFilter(hits, filters.period);
      
      return {
        success: true,
        data: {
          complaintData: chartData
        }
      };
    } catch (error) {
      console.error('Error generating complaint chart data:', error);
      return {
        success: false,
        message: 'Error generating complaint chart data',
        error: error.message || error
      };
    }
  }

  private processComplaintChartDataFilter(data: any[], periodType: string = 'Monthly') {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processDailyDataFilter(data);
        break;
      case 'Weekly':
        processedData = this.processWeeklyDataFilter(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processMonthlyDataFilter(data);
        break;
    }
    
    return processedData;
  }

  private processDailyDataFilter(data: any[]) {
    // Group by day and type (Power Bank)
    const groupedByDay: Record<string, { Complaint: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { Complaint: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { Complaint: 0 };
        }
          groupedByDay[date].Complaint += 1;
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Complaint',
        data: categories.map(date => groupedByDay[date].Complaint)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processWeeklyDataFilter(data: any[]) {
    // Group by week and type (Power Bank)
    const groupedByWeek: Record<string, { Complaint: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { Complaint: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
            groupedByWeek[weekLabel] = { Complaint: 0 };
        }
        
          groupedByWeek[weekLabel].Complaint += 1;
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Complaint',
        data: categories.map(week => groupedByWeek[week].Complaint)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processMonthlyDataFilter(data: any[]) {
    // Group by month and type (Power Bank)
    const groupedByMonth: Record<string, { Complaint: number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { Complaint: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { Complaint: 0 };
        }
        
        groupedByMonth[monthLabel].Complaint += 1;
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Complaint',
        data: categories.map(month => groupedByMonth[month].Complaint)
      }
    ];
    
    return {
      categories,
      series
    };
  }

////////////////////////////
async getRatingStatistics(
  filters: {
      fromDate?: string;
      toDate?: string;
  }
) {
  try {
      // Build the query for all services
      const query: any = {
          bool: {
              filter: []
          }
      };

      // Add type filter
      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
          const dateRange: any = { range: { 'createdAt': {} } };
          if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
          if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
          query.bool.filter.push(dateRange);
      }

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
          index: 'complaints',
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

/////////////////////////////
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

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
          index: 'complaints',
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
////////////////////////////
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
      Complaint: { totalDuration: number, count: number }
    }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { 
        Complaint: { totalDuration: 0, count: 0 }
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
            Complaint: { totalDuration: 0, count: 0 }
          };
        }
        
        if (type === 'Power Bank') {
          groupedByDay[date].Complaint.totalDuration += durationMinutes;
          groupedByDay[date].Complaint.count += 1;
        }
      }
    });
    
    // Calculate averages and format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Complaint - Average Duration (minutes)',
        data: categories.map(date => {
          const group = groupedByDay[date].Complaint;
          return group.count > 0 ? parseFloat((group.totalDuration / group.count).toFixed(1)) : 0;
        })
      },
      {
        name: 'Complaint - Request Count',
        data: categories.map(date => groupedByDay[date].Complaint.count)
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
///////////////////////////
  async getClosedVsStatusReportData(filters: ComplaintChartDto) {
    try {
      // Build the query
      const query: any = {
        bool: {
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

      // Add complaint type filter if provided
      if (filters.complaint_type) {
        query.bool.filter.push({
          match: { 'type.keyword': filters.complaint_type }
        });
      }

      // Add touchpoint filter if provided
      if (filters.touchpointId) {
        query.bool.filter.push({
          match: { 'touchpointId.keyword': filters.touchpointId }
        });
      }

      // Add category filter if provided
      if (filters.categoryId) {
        query.bool.filter.push({
          match: { 'categoryId.keyword': filters.categoryId }
        });
      }

      // Add sections filter if provided
      if (filters.sectionsId) {
        query.bool.filter.push({
          match: { 'sections.id.keyword': filters.sectionsId }
        });
      }

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'complaints',
        body: {
          query,
          size: 10000 // Get all matching documents
        }
      });
      const hits = result.body.hits.hits.map((hit: any) => hit._source);
      
      // Process data for charts
      const donutChartData = this.processStatusDonutData(hits);
      const barChartData = this.processStatusBarData(hits, filters.period);
      
      return {
        success: true,
        data: {
          donutChart: donutChartData,
          barChart: barChartData
        }
      };
    } catch (error) {
      console.error('Error generating closed vs status report data:', error);
      return {
        success: false,
        message: 'Error generating closed vs status report data',
        error: error.message || error
      };
    }
  }

  private processStatusDonutData(data: any[]) {
    // Count complaints by status (Resolved vs Unresolved)
    const statusCounts = {
      Resolved: 0,
      Unresolved: 0
    };
    
    // Process data - only count complaints within the date range shown in the bar chart
    const today = moment();
    const startDate = moment(today).subtract(29, 'days').startOf('day');
    
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      
      // Only count if within the last 30 days (same as bar chart)
      if (itemDate.isSameOrAfter(startDate)) {
        if (item.status === 'Closed' || item.status === 'Disapprove') {
          statusCounts.Resolved += 1;
        } else {
          statusCounts.Unresolved += 1;
        }
      }
    });
    
    // Format for donut chart
    return {
      labels: ['Resolved', 'Unresolved'],
      series: [statusCounts.Resolved, statusCounts.Unresolved]
    };
  }

  private processStatusBarData(data: any[], periodType: string = 'Monthly') {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processStatusDailyData(data);
        break;
      case 'Weekly':
        processedData = this.processStatusWeeklyData(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processStatusMonthlyData(data);
        break;
    }
    
    return processedData;
  }

  private processStatusDailyData(data: any[]) {
    // Group by day and status
    const groupedByDay: Record<string, { Resolved: number, Unresolved: number }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { Resolved: 0, Unresolved: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { Resolved: 0, Unresolved: 0 };
        }
        
        if (item.status === 'Closed' || item.status === 'Disapprove') {
          groupedByDay[date].Resolved += 1;
        } else {
          groupedByDay[date].Unresolved += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Resolved',
        data: categories.map(date => groupedByDay[date].Resolved)
      },
      {
        name: 'Unresolved',
        data: categories.map(date => groupedByDay[date].Unresolved)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processStatusWeeklyData(data: any[]) {
    // Group by week and status
    const groupedByWeek: Record<string, { Resolved: number, Unresolved: number }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { Resolved: 0, Unresolved: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { Resolved: 0, Unresolved: 0 };
        }
        
        if (item.status === 'Closed' || item.status === 'Disapprove') {
          groupedByWeek[weekLabel].Resolved += 1;
        } else {
          groupedByWeek[weekLabel].Unresolved += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Resolved',
        data: categories.map(week => groupedByWeek[week].Resolved)
      },
      {
        name: 'Unresolved',
        data: categories.map(week => groupedByWeek[week].Unresolved)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processStatusMonthlyData(data: any[]) {
    // Group by month and status
    const groupedByMonth: Record<string, { Resolved: number, Unresolved: number }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { Resolved: 0, Unresolved: 0 };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { Resolved: 0, Unresolved: 0 };
        }
        
        if (item.status === 'Closed' || item.status === 'Disapprove') {
          groupedByMonth[monthLabel].Resolved += 1;
        } else {
          groupedByMonth[monthLabel].Unresolved += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Resolved',
        data: categories.map(month => groupedByMonth[month].Resolved)
      },
      {
        name: 'Unresolved',
        data: categories.map(month => groupedByMonth[month].Unresolved)
      }
    ];
    
    return {
      categories,
      series
    };
  }

  ////////////////

  async getComplaintTypesReportData(filters: ComplaintChartDto) {
    try {
      // Build the query
      const query: any = {
        bool: {
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

      // Add touchpoint filter if provided
      if (filters.touchpointId) {
        query.bool.filter.push({
          match: { 'touchpointId.keyword': filters.touchpointId }
        });
      }

      // Add category filter if provided
      if (filters.categoryId) {
        query.bool.filter.push({
          match: { 'categoryId.keyword': filters.categoryId }
        });
      }

      // Add sections filter if provided
      if (filters.sectionsId) {
        query.bool.filter.push({
          match: { 'sections.id.keyword': filters.sectionsId }
        });
      }

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'complaints',
        body: {
          query,
          size: 10000 // Get all matching documents
        }
      });
      const hits = result.body.hits.hits.map((hit: any) => hit._source);
      
      // Process data for chart based on the period type
      const chartData = this.processComplaintTypesData(hits, filters.period);
      
      return {
        success: true,
        data: {
          complaintTypesData: chartData
        }
      };
    } catch (error) {
      console.error('Error generating complaint types chart data:', error);
      return {
        success: false,
        message: 'Error generating complaint types chart data',
        error: error.message || error
      };
    }
  }

  private processComplaintTypesData(data: any[], periodType: string = 'Monthly') {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processComplaintTypesDailyData(data);
        break;
      case 'Weekly':
        processedData = this.processComplaintTypesWeeklyData(data);
        break;
      case 'Hourly':
        processedData = this.processComplaintTypesHourlyData(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processComplaintTypesMonthlyData(data);
        break;
    }
    
    return processedData;
  }

  private processComplaintTypesDailyData(data: any[]) {
    // Group by day and complaint type
    const groupedByDay: Record<string, { 
      'Mall Complaint': number, 
      'Tenant Complaint': number, 
      'Shops Complaint': number 
    }> = {};
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { 
        'Mall Complaint': 0, 
        'Tenant Complaint': 0, 
        'Shops Complaint': 0 
      };
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const complaintType = item.type || 'Unknown';
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { 
            'Mall Complaint': 0, 
            'Tenant Complaint': 0, 
            'Shops Complaint': 0 
          };
        }
        
        // Increment the count for the specific complaint type
        if (groupedByDay[date][complaintType] !== undefined) {
          groupedByDay[date][complaintType] += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = [
      {
        name: 'Mall Complaint',
        data: categories.map(date => groupedByDay[date]['Mall Complaint'])
      },
      {
        name: 'Tenant Complaint',
        data: categories.map(date => groupedByDay[date]['Tenant Complaint'])
      },
      {
        name: 'Shops Complaint',
        data: categories.map(date => groupedByDay[date]['Shops Complaint'])
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processComplaintTypesWeeklyData(data: any[]) {
    // Group by week and complaint type
    const groupedByWeek: Record<string, { 
      'Mall Complaint': number, 
      'Tenant Complaint': number, 
      'Shops Complaint': number 
    }> = {};
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { 
        'Mall Complaint': 0, 
        'Tenant Complaint': 0, 
        'Shops Complaint': 0 
      };
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const complaintType = item.type || 'Unknown';
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { 
            'Mall Complaint': 0, 
            'Tenant Complaint': 0, 
            'Shops Complaint': 0 
          };
        }
        
        // Increment the count for the specific complaint type
        if (groupedByWeek[weekLabel][complaintType] !== undefined) {
          groupedByWeek[weekLabel][complaintType] += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Mall Complaint',
        data: categories.map(week => groupedByWeek[week]['Mall Complaint'])
      },
      {
        name: 'Tenant Complaint',
        data: categories.map(week => groupedByWeek[week]['Tenant Complaint'])
      },
      {
        name: 'Shops Complaint',
        data: categories.map(week => groupedByWeek[week]['Shops Complaint'])
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processComplaintTypesMonthlyData(data: any[]) {
    // Group by month and complaint type
    const groupedByMonth: Record<string, { 
      'Mall Complaint': number, 
      'Tenant Complaint': number, 
      'Shops Complaint': number 
    }> = {};
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { 
        'Mall Complaint': 0, 
        'Tenant Complaint': 0, 
        'Shops Complaint': 0 
      };
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const complaintType = item.type || 'Unknown';
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { 
            'Mall Complaint': 0, 
            'Tenant Complaint': 0, 
            'Shops Complaint': 0 
          };
        }
        
        // Increment the count for the specific complaint type
        if (groupedByMonth[monthLabel][complaintType] !== undefined) {
          groupedByMonth[monthLabel][complaintType] += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Mall Complaint',
        data: categories.map(month => groupedByMonth[month]['Mall Complaint'])
      },
      {
        name: 'Tenant Complaint',
        data: categories.map(month => groupedByMonth[month]['Tenant Complaint'])
      },
      {
        name: 'Shops Complaint',
        data: categories.map(month => groupedByMonth[month]['Shops Complaint'])
      }
    ];
    
    return {
      categories,
      series
    };
  }

  private processComplaintTypesHourlyData(data: any[]) {
    // Group by hour and complaint type
    const groupedByHour: Record<string, { 
      'Mall Complaint': number, 
      'Tenant Complaint': number, 
      'Shops Complaint': number 
    }> = {};
    
    // Initialize 24 hours
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      const hourLabel = `${hour}:00`;
      groupedByHour[hourLabel] = { 
        'Mall Complaint': 0, 
        'Tenant Complaint': 0, 
        'Shops Complaint': 0 
      };
    }
    
    // Group data
    data.forEach(item => {
      const hour = moment(item.createdAt).format('HH:00');
      const complaintType = item.type || 'Unknown';
      
      if (!groupedByHour[hour]) {
        groupedByHour[hour] = { 
          'Mall Complaint': 0, 
          'Tenant Complaint': 0, 
          'Shops Complaint': 0 
        };
      }
      
      // Increment the count for the specific complaint type
      if (groupedByHour[hour][complaintType] !== undefined) {
        groupedByHour[hour][complaintType] += 1;
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByHour).sort();
    const series = [
      {
        name: 'Mall Complaint',
        data: categories.map(hour => groupedByHour[hour]['Mall Complaint'])
      },
      {
        name: 'Tenant Complaint',
        data: categories.map(hour => groupedByHour[hour]['Tenant Complaint'])
      },
      {
        name: 'Shops Complaint',
        data: categories.map(hour => groupedByHour[hour]['Shops Complaint'])
      }
    ];
    
    return {
      categories,
      series
    };
  }

  async getSectionsComplaintsReportData(filters: ComplaintChartDto) {
    try {
      // Build the query
      const query: any = {
        bool: {
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

      // Add status filter (Resolved/Unresolved)
      if (filters.status) {
        if (filters.status === 'Resolved') {
          // If Resolved is selected, filter for Closed status
          query.bool.filter.push({
            match: { 'status.keyword': 'Closed' }
          });
        } else if (filters.status === 'Unresolved') {
          // If Unresolved is selected, exclude Closed status
          query.bool.filter.push({
            bool: {
              must_not: {
                match: { 'status.keyword': 'Closed' }
              }
            }
          });
        }
      }

      // Add complaint type filter if provided
      if (filters.complaint_type) {
        query.bool.filter.push({
          match: { 'type.keyword': filters.complaint_type }
        });
      }

      // Add sections department filter if provided
      if (filters.departmentId) {
        query.bool.filter.push({
          match: { 'sections.department.id.keyword': filters.departmentId }
        });
      }

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'complaints',
        body: {
          query,
          size: 10000 // Get all matching documents
        }
      });
      const hits = result.body.hits.hits.map((hit: any) => hit._source);
      
      // Process data for chart based on the period type
      const chartData = this.processSectionsComplaintsData(hits, filters.period);
      
      return {
        success: true,
        data: {
          sectionsComplaintsData: chartData
        }
      };
    } catch (error) {
      console.error('Error generating sections complaints chart data:', error);
      return {
        success: false,
        message: 'Error generating sections complaints chart data',
        error: error.message || error
      };
    }
  }

  private processSectionsComplaintsData(data: any[], periodType: string = 'Monthly') {
    // First, collect all unique sections from the data
    const allSections = new Set<string>();
    data.forEach(item => {
      if (item.sections && Array.isArray(item.sections)) {
        item.sections.forEach(section => {
          if (section && section.name) {
            allSections.add(section.name);
          }
        });
      }
    });
    
    // Convert to array and sort alphabetically
    const sectionNames = Array.from(allSections).sort();
    
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processSectionsComplaintsDailyData(data, sectionNames);
        break;
      case 'Weekly':
        processedData = this.processSectionsComplaintsWeeklyData(data, sectionNames);
        break;
      case 'Monthly':
      default:
        processedData = this.processSectionsComplaintsMonthlyData(data, sectionNames);
        break;
    }
    
    return processedData;
  }

  private processSectionsComplaintsDailyData(data: any[], sectionNames: string[]) {
    // Create a record to store section counts by day
    const groupedByDay: Record<string, Record<string, number>> = {};
    
    // Initialize last 30 days with all sections set to 0
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = {};
      
      // Initialize count for each section to 0
      sectionNames.forEach(section => {
        groupedByDay[date][section] = 0;
      });
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = {};
          sectionNames.forEach(section => {
            groupedByDay[date][section] = 0;
          });
        }
        
        // Increment counts for each section in this complaint
        if (item.sections && Array.isArray(item.sections)) {
          item.sections.forEach(section => {
            if (section && section.name && groupedByDay[date][section.name] !== undefined) {
              groupedByDay[date][section.name] += 1;
            }
          });
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = sectionNames.map(section => ({
      name: section,
      data: categories.map(date => groupedByDay[date][section])
    }));
    
    return {
      categories,
      series
    };
  }

  private processSectionsComplaintsWeeklyData(data: any[], sectionNames: string[]) {
    // Create a record to store section counts by week
    const groupedByWeek: Record<string, Record<string, number>> = {};
    
    // Initialize last 12 weeks with all sections set to 0
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = {};
      
      // Initialize count for each section to 0
      sectionNames.forEach(section => {
        groupedByWeek[weekLabel][section] = 0;
      });
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = {};
          sectionNames.forEach(section => {
            groupedByWeek[weekLabel][section] = 0;
          });
        }
        
        // Increment counts for each section in this complaint
        if (item.sections && Array.isArray(item.sections)) {
          item.sections.forEach(section => {
            if (section && section.name && groupedByWeek[weekLabel][section.name] !== undefined) {
              groupedByWeek[weekLabel][section.name] += 1;
            }
          });
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = sectionNames.map(section => ({
      name: section,
      data: categories.map(week => groupedByWeek[week][section])
    }));
    
    return {
      categories,
      series
    };
  }

  private processSectionsComplaintsMonthlyData(data: any[], sectionNames: string[]) {
    // Create a record to store section counts by month
    const groupedByMonth: Record<string, Record<string, number>> = {};
    
    // Initialize last 12 months with all sections set to 0
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = {};
      
      // Initialize count for each section to 0
      sectionNames.forEach(section => {
        groupedByMonth[monthLabel][section] = 0;
      });
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = {};
          sectionNames.forEach(section => {
            groupedByMonth[monthLabel][section] = 0;
          });
        }
        
        // Increment counts for each section in this complaint
        if (item.sections && Array.isArray(item.sections)) {
          item.sections.forEach(section => {
            if (section && section.name && groupedByMonth[monthLabel][section.name] !== undefined) {
              groupedByMonth[monthLabel][section.name] += 1;
            }
          });
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = sectionNames.map(section => ({
      name: section,
      data: categories.map(month => groupedByMonth[month][section])
    }));
    
    return {
      categories,
      series
    };
  }

  async getSectionsDepartmentReportData(filters: ComplaintChartDto) {
    try {
      // Build the query
      const query: any = {
        bool: {
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

      // Add status filter (Resolved/Unresolved)
      if (filters.status) {
        if (filters.status === 'Resolved') {
          // If Resolved is selected, filter for Closed or Disapproved status
          query.bool.filter.push({
            bool: {
              should: [
                { match: { 'status.keyword': 'Closed' } },
                { match: { 'status.keyword': 'Disapproved' } }
              ],
              minimum_should_match: 1
            }
          });
        } else if (filters.status === 'Unresolved') {
          // If Unresolved is selected, exclude Closed and Disapproved status
          query.bool.filter.push({
            bool: {
              must_not: [
                { match: { 'status.keyword': 'Closed' } },
                { match: { 'status.keyword': 'Disapproved' } }
              ]
            }
          });
        }
      }

      // Add complaint type filter if provided
      if (filters.complaint_type) {
        query.bool.filter.push({
          match: { 'type.keyword': filters.complaint_type }
        });
      }

      // Add sections department filter if provided
      if (filters.departmentId) {
        query.bool.filter.push({
          match: { 'sections.department.id.keyword': filters.departmentId }
        });
      }

      // Use scroll API to get all complaints
      const allHits = [];
      const initialScrollResponse = await this.elasticSearchService.getSearchService().search({
        index: 'complaints',
        body: {
          query,
          size: 1000 // Get 1000 documents per scroll
        },
        scroll: '1m' // Keep the scroll context alive for 1 minute
      });
      
      // Collect hits from initial response
      const initialHits = initialScrollResponse.body.hits.hits;
      allHits.push(...initialHits.map(hit => hit._source));
      
      // Continue scrolling if more results
      let scrollId = initialScrollResponse.body._scroll_id;
      while (initialHits.length > 0 && scrollId) {
        const scrollResponse = await this.elasticSearchService.getSearchService().scroll({
          scroll_id: scrollId,
          scroll: '1m'
        });
        
        const hits = scrollResponse.body.hits.hits;
        if (hits.length === 0) {
          break; // No more results
        }
        
        allHits.push(...hits.map(hit => hit._source));
        scrollId = scrollResponse.body._scroll_id;
      }
      
      // Clear scroll context when done
      if (scrollId) {
        await this.elasticSearchService.getSearchService().clearScroll({
          scroll_id: scrollId
        });
      }
      const chartData = this.processSectionsDepartmentData(allHits, filters.period);
      
      return {
        success: true,
        data: {
          sectionsDepartmentData: chartData,
          totalFetched: allHits.length
        }
      };
    } catch (error) {
      console.error('Error generating sections department chart data:', error);
      return {
        success: false,
        message: 'Error generating sections department chart data',
        error: error.message || error
      };
    }
  }

  private processSectionsDepartmentData(data: any[], periodType: string = 'Monthly') {
    // First, collect all unique sections from the data
    const allSections = new Set<string>();
    data.forEach(item => {
      if (item.sections && Array.isArray(item.sections)) {
        item.sections.forEach(section => {
          if (section && section.name) {
            allSections.add(section.name);
          }
        });
      }
    });
    
    // Convert to array and sort alphabetically
    const sectionNames = Array.from(allSections).sort();
    
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processSectionsDepartmentDailyData(data, sectionNames);
        break;
      case 'Weekly':
        processedData = this.processSectionsDepartmentWeeklyData(data, sectionNames);
        break;
      case 'Monthly':
      default:
        processedData = this.processSectionsDepartmentMonthlyData(data, sectionNames);
        break;
    }
    
    return processedData;
  }

  private processSectionsDepartmentDailyData(data: any[], sectionNames: string[]) {
    // Create a record to store section counts by day
    const groupedByDay: Record<string, Record<string, number>> = {};
    
    // Initialize last 30 days with all sections set to 0
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = {};
      
      // Initialize count for each section to 0
      sectionNames.forEach(section => {
        groupedByDay[date][section] = 0;
      });
    }
    
    // Group data
    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      
      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = {};
          sectionNames.forEach(section => {
            groupedByDay[date][section] = 0;
          });
        }
        
        // Increment counts for each section in this complaint
        if (item.sections && Array.isArray(item.sections)) {
          item.sections.forEach(section => {
            if (section && section.name && groupedByDay[date][section.name] !== undefined) {
              groupedByDay[date][section.name] += 1;
            }
          });
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = sectionNames.map(section => ({
      name: section,
      data: categories.map(date => groupedByDay[date][section])
    }));
    
    return {
      categories,
      series
    };
  }

  private processSectionsDepartmentWeeklyData(data: any[], sectionNames: string[]) {
    // Create a record to store section counts by week
    const groupedByWeek: Record<string, Record<string, number>> = {};
    
    // Initialize last 12 weeks with all sections set to 0
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = {};
      
      // Initialize count for each section to 0
      sectionNames.forEach(section => {
        groupedByWeek[weekLabel][section] = 0;
      });
    }
    
    // Group data
    data.forEach(item => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      
      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = {};
          sectionNames.forEach(section => {
            groupedByWeek[weekLabel][section] = 0;
          });
        }
        
        // Increment counts for each section in this complaint
        if (item.sections && Array.isArray(item.sections)) {
          item.sections.forEach(section => {
            if (section && section.name && groupedByWeek[weekLabel][section.name] !== undefined) {
              groupedByWeek[weekLabel][section.name] += 1;
            }
          });
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = sectionNames.map(section => ({
      name: section,
      data: categories.map(week => groupedByWeek[week][section])
    }));
    
    return {
      categories,
      series
    };
  }

  private processSectionsDepartmentMonthlyData(data: any[], sectionNames: string[]) {
    // Create a record to store section counts by month
    const groupedByMonth: Record<string, Record<string, number>> = {};
    
    // Initialize last 12 months with all sections set to 0
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = {};
      
      // Initialize count for each section to 0
      sectionNames.forEach(section => {
        groupedByMonth[monthLabel][section] = 0;
      });
    }
    
    // Group data
    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      
      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = {};
          sectionNames.forEach(section => {
            groupedByMonth[monthLabel][section] = 0;
          });
        }
        
        // Increment counts for each section in this complaint
        if (item.sections && Array.isArray(item.sections)) {
          item.sections.forEach(section => {
            if (section && section.name && groupedByMonth[monthLabel][section.name] !== undefined) {
              groupedByMonth[monthLabel][section.name] += 1;
            }
          });
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = sectionNames.map(section => ({
      name: section,
      data: categories.map(month => groupedByMonth[month][section])
    }));
    
    return {
      categories,
      series
    };
  }

  async getRepeatedCustomersData(filters: {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    try {
      // Build the query
      const query: any = {
        bool: {
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

      // Add customer age filter if provided
      if (filters.minAge !== undefined || filters.maxAge !== undefined) {
        const ageFilter: any = { range: { 'customer.age': {} } };
        if (filters.minAge !== undefined) ageFilter.range['customer.age'].gte = filters.minAge;
        if (filters.maxAge !== undefined) ageFilter.range['customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageFilter);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'customer.gender.keyword': filters.gender }
        });
      }

      // Use scroll API to get all complaints
      const allHits = [];
      const initialScrollResponse = await this.elasticSearchService.getSearchService().search({
        index: 'complaints',
        body: {
          query,
          size: 1000 // Get 1000 documents per scroll
        },
        scroll: '1m' // Keep the scroll context alive for 1 minute
      });
      
      // Collect hits from initial response
      const initialHits = initialScrollResponse.body.hits.hits;
      allHits.push(...initialHits.map(hit => hit._source));
      
      // Continue scrolling if more results
      let scrollId = initialScrollResponse.body._scroll_id;
      while (initialHits.length > 0 && scrollId) {
        const scrollResponse = await this.elasticSearchService.getSearchService().scroll({
          scroll_id: scrollId,
          scroll: '1m'
        });
        
        const hits = scrollResponse.body.hits.hits;
        if (hits.length === 0) {
          break; // No more results
        }
        
        allHits.push(...hits.map(hit => hit._source));
        scrollId = scrollResponse.body._scroll_id;
      }
      
      // Clear scroll context when done
      if (scrollId) {
        await this.elasticSearchService.getSearchService().clearScroll({
          scroll_id: scrollId
        });
      }
      
      
      // Process data for Pareto chart
      const chartData = this.processRepeatedCustomersData(allHits);
      
      return {
        success: true,
        data: {
          repeatedCustomersData: chartData,
          totalFetched: allHits.length
        }
      };
    } catch (error) {
      console.error('Error generating repeated customers chart data:', error);
      return {
        success: false,
        message: 'Error generating repeated customers chart data',
        error: error.message || error
      };
    }
  }

  private processRepeatedCustomersData(data: any[]) {
    // Group complaints by customer
    const customerComplaints = new Map<string, { 
      id: string, 
      name: string, 
      email: string,
      count: number 
    }>();
    
    // Count complaints for each customer
    data.forEach(complaint => {
      if (complaint.customer && complaint.customer.id) {
        const customerId = complaint.customer.id;
        
        if (!customerComplaints.has(customerId)) {
          customerComplaints.set(customerId, {
            id: customerId,
            name: complaint.customer.name || 'Unknown',
            email: complaint.customer.email || 'Unknown',
            count: 0
          });
        }
        
        const customer = customerComplaints.get(customerId);
        customer.count += 1;
      }
    });
    
    // Convert to array and sort by count (descending)
    const sortedCustomers = Array.from(customerComplaints.values())
      .sort((a, b) => b.count - a.count);
    
    // Calculate total complaints
    const totalComplaints = sortedCustomers.reduce((sum, customer) => sum + customer.count, 0);
    
    // Calculate cumulative percentage for Pareto chart
    let cumulativeCount = 0;
    const paretoData = sortedCustomers.map(customer => {
      cumulativeCount += customer.count;
      const cumulativePercentage = (cumulativeCount / totalComplaints) * 100;
      
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        count: customer.count,
        percentage: (customer.count / totalComplaints) * 100,
        cumulativePercentage: cumulativePercentage
      };
    });
    
    // Format data for chart (top 20 customers for readability)
    const topCustomers = paretoData.slice(0, 20);
    
    // Prepare chart data
    const categories = topCustomers.map(c => c.name);
    const barSeries = [{
      name: 'Complaints',
      type: 'column',
      data: topCustomers.map(c => c.count)
    }];
    const lineSeries = [{
      name: 'Cumulative %',
      type: 'line',
      data: topCustomers.map(c => Math.round(c.cumulativePercentage * 100) / 100),
      yAxis: 1
    }];
    
    return {
      categories,
      series: [...barSeries, ...lineSeries],
      tableData: topCustomers,
      totalCustomers: customerComplaints.size,
      totalComplaints
    };
  }

  async getComplaintsKpiReportData(filters: ComplaintChartDto) {
    try {
      // Build the query
      const query: any = {
        bool: {
          must: [
            { match: { 'status.keyword': 'Closed' } }
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

      // Add complaint type filter if provided
      if (filters.complaint_type) {
        query.bool.filter.push({
          match: { 'type.keyword': filters.complaint_type }
        });
      }

      // Add category filter if provided
      if (filters.categoryId) {
        query.bool.filter.push({
          match: { 'category.id.keyword': filters.categoryId }
        });
      }

      // Add touchpoint (sub-category) filter if provided
      if (filters.touchpointId) {
        query.bool.filter.push({
          match: { 'touchpoint.id.keyword': filters.touchpointId }
        });
      }

      // Add sections filter if provided
      if (filters.sectionsId) {
        query.bool.filter.push({
          match: { 'sections.id.keyword': filters.sectionsId }
        });
      }

      
      // Use scroll API to get all complaints
      const allHits = [];
      const initialScrollResponse = await this.elasticSearchService.getSearchService().search({
        index: 'complaints',
        body: {
          query,
          size: 1000 // Get 1000 documents per scroll
        },
        scroll: '1m' // Keep the scroll context alive for 1 minute
      });
      
      const initialHits = initialScrollResponse.body.hits.hits;
      allHits.push(...initialHits.map(hit => hit._source));
      
      // Continue scrolling if more results
      let scrollId = initialScrollResponse.body._scroll_id;
      while (initialHits.length > 0 && scrollId) {
        const scrollResponse = await this.elasticSearchService.getSearchService().scroll({
          scroll_id: scrollId,
          scroll: '1m'
        });
        
        const hits = scrollResponse.body.hits.hits;
        if (hits.length === 0) {
          break; // No more results
        }
        
        allHits.push(...hits.map(hit => hit._source));
        scrollId = scrollResponse.body._scroll_id;
      }
      
      // Clear scroll context when done
      if (scrollId) {
        await this.elasticSearchService.getSearchService().clearScroll({
          scroll_id: scrollId
        });
      }
      
      
      // Process data
      const chartData = this.processKpiComplaintsData(allHits, filters.period);
      
      return {
        success: true,
        data: {
          complaintsKpiData: chartData,
          totalFetched: allHits.length
        }
      };
    } catch (error) {
      console.error('Error generating complaints KPI chart data:', error);
      return {
        success: false,
        message: 'Error generating complaints KPI chart data',
        error: error.message || error
      };
    }
  }

  private processKpiComplaintsData(data: any[], periodType: string = 'Monthly') {
    // Group complaints by within KPI and exceeded KPI
    
    // Calculate which complaints are within or exceeded KPI
    const withinKPI = [];
    const exceededKPI = [];
    
    data.forEach(complaint => {
      // Check if complaint has metadata.escalation set to true
      if (complaint.metadata && complaint.metadata.escalation === true) {
        exceededKPI.push(complaint);
      } else {
        withinKPI.push(complaint);
      }
    });
    
    // Prepare pie chart data
    const pieChartData = [
      { name: 'Within KPI', y: withinKPI.length },
      { name: 'Exceeded KPI', y: exceededKPI.length }
    ];
    
    // Prepare line chart data by period
    let periodData;
    
    switch (periodType) {
      case 'Daily':
        periodData = this.processKpiDailyData(data);
        break;
      case 'Weekly':
        periodData = this.processKpiWeeklyData(data);
        break;
      case 'Monthly':
      default:
        periodData = this.processKpiMonthlyData(data);
        break;
    }
    
    // Create detailed table data
    const tableData = this.createKpiTableData(data);
    
    return {
      pieChart: {
        series: [{
          name: 'KPI Status',
          data: pieChartData
        }]
      },
      lineChart: periodData,
      tableData,
      summary: {
        totalComplaints: data.length,
        withinKPI: withinKPI.length,
        exceededKPI: exceededKPI.length,
        withinKpiPercentage: data.length > 0 ? Math.round((withinKPI.length / data.length) * 100) : 0
      }
    };
  }
  
  private processKpiDailyData(data: any[]) {
    // Group data by day
    const dailyData = {};
    
    // Initialize data structure with empty arrays
    data.forEach(complaint => {
      const createdAt = new Date(complaint.createdAt);
      const dateKey = createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          total: 0,
          withinKPI: 0,
          exceededKPI: 0
        };
      }
      
      dailyData[dateKey].total++;
      
      // Check if complaint has metadata.escalation set to true
      if (complaint.metadata && complaint.metadata.escalation === true) {
        dailyData[dateKey].exceededKPI++;
      } else {
        dailyData[dateKey].withinKPI++;
      }
    });
    
    // Sort dates
    const sortedDates = Object.keys(dailyData).sort();
    
    // Prepare chart series
    const categories = sortedDates.map(date => {
      // Format date for display (e.g., "Jan 15")
      const dateObj = new Date(date);
      return `${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getDate()}`;
    });
    
    const withinKPISeries = sortedDates.map(date => dailyData[date].withinKPI);
    const exceededKPISeries = sortedDates.map(date => dailyData[date].exceededKPI);
    const kpiPercentageSeries = sortedDates.map(date => {
      const total = dailyData[date].total;
      return total > 0 ? Math.round((dailyData[date].withinKPI / total) * 100) : 0;
    });
    
    return {
      categories,
      series: [
        { name: 'Within KPI', data: withinKPISeries, type: 'column' },
        { name: 'Exceeded KPI', data: exceededKPISeries, type: 'column' },
        { name: 'KPI Percentage', data: kpiPercentageSeries, type: 'line', yAxis: 1 }
      ]
    };
  }
  
  // Create detailed table data for KPI complaints
  private createKpiTableData(data: any[]) {
    // Group by complaint type, category, touchpoint, and section
    const typeData = {};
    const categoryData = {};
    const touchpointData = {};
    const sectionData = {};
    
    data.forEach(complaint => {
      // Extract key fields
      const type = complaint.type || 'Unknown';
      const category = complaint.category?.name?.en || 'Unknown';
      const touchpoint = complaint.touchpoint?.name?.en || 'Unknown';
      const isExceededKPI = complaint.metadata && complaint.metadata.escalation === true;
      
      // Process by type
      if (!typeData[type]) {
        typeData[type] = {
          name: type,
          total: 0,
          withinKPI: 0,
          exceededKPI: 0
        };
      }
      
      typeData[type].total += 1;
      if (isExceededKPI) {
        typeData[type].exceededKPI += 1;
      } else {
        typeData[type].withinKPI += 1;
      }
      
      // Process by category
      if (!categoryData[category]) {
        categoryData[category] = {
          name: category,
          total: 0,
          withinKPI: 0,
          exceededKPI: 0
        };
      }
      
      categoryData[category].total += 1;
      if (isExceededKPI) {
        categoryData[category].exceededKPI += 1;
      } else {
        categoryData[category].withinKPI += 1;
      }
      
      // Process by touchpoint
      if (!touchpointData[touchpoint]) {
        touchpointData[touchpoint] = {
          name: touchpoint,
          total: 0,
          withinKPI: 0,
          exceededKPI: 0
        };
      }
      
      touchpointData[touchpoint].total += 1;
      if (isExceededKPI) {
        touchpointData[touchpoint].exceededKPI += 1;
      } else {
        touchpointData[touchpoint].withinKPI += 1;
      }
      
      // Process by section
      if (complaint.sections && Array.isArray(complaint.sections)) {
        complaint.sections.forEach(section => {
          const sectionName = section.name || 'Unknown';
          
          if (!sectionData[sectionName]) {
            sectionData[sectionName] = {
              name: sectionName,
              total: 0,
              withinKPI: 0,
              exceededKPI: 0
            };
          }
          
          sectionData[sectionName].total += 1;
          if (isExceededKPI) {
            sectionData[sectionName].exceededKPI += 1;
          } else {
            sectionData[sectionName].withinKPI += 1;
          }
        });
      }
    });
    
    // Convert to arrays and calculate percentages
    const typesTable = Object.values(typeData).map((item: any) => ({
      ...item,
      withinKpiPercentage: item.total > 0 ? Math.round((item.withinKPI / item.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
    
    const categoriesTable = Object.values(categoryData).map((item: any) => ({
      ...item,
      withinKpiPercentage: item.total > 0 ? Math.round((item.withinKPI / item.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
    
    const touchpointsTable = Object.values(touchpointData).map((item: any) => ({
      ...item,
      withinKpiPercentage: item.total > 0 ? Math.round((item.withinKPI / item.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
    
    const sectionsTable = Object.values(sectionData).map((item: any) => ({
      ...item,
      withinKpiPercentage: item.total > 0 ? Math.round((item.withinKPI / item.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
    
    // Get status distribution
    const statusData = {};
    data.forEach(complaint => {
      const status = complaint.status || 'Unknown';
      const isExceededKPI = complaint.metadata && complaint.metadata.escalation === true;
      
      if (!statusData[status]) {
        statusData[status] = {
          name: status,
          total: 0,
          withinKPI: 0,
          exceededKPI: 0
        };
      }
      
      statusData[status].total += 1;
      if (isExceededKPI) {
        statusData[status].exceededKPI += 1;
      } else {
        statusData[status].withinKPI += 1;
      }
    });
    
    const statusTable = Object.values(statusData).map((item: any) => ({
      ...item,
      withinKpiPercentage: item.total > 0 ? Math.round((item.withinKPI / item.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
    
    return {
      byType: typesTable,
      byCategory: categoriesTable,
      byTouchpoint: touchpointsTable,
      bySection: sectionsTable,
      byStatus: statusTable
    };
  }
  
  private processKpiWeeklyData(data: any[]) {
    // Group data by week
    const weeklyData = {};
    
    // Initialize data structure with empty arrays
    data.forEach(complaint => {
      const createdAt = new Date(complaint.createdAt);
      const year = createdAt.getFullYear();
      const weekNumber = this.getWeekNumber(createdAt);
      const weekKey = `${year}-W${weekNumber}`;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          total: 0,
          withinKPI: 0,
          exceededKPI: 0,
          startDate: this.getStartDateOfWeek(year, weekNumber)
        };
      }
      
      weeklyData[weekKey].total++;
      
      // Check if complaint has metadata.escalation set to true
      if (complaint.metadata && complaint.metadata.escalation === true) {
        weeklyData[weekKey].exceededKPI++;
      } else {
        weeklyData[weekKey].withinKPI++;
      }
    });
    
    // Sort weeks by date
    const sortedWeeks = Object.keys(weeklyData).sort((a, b) => {
      return weeklyData[a].startDate.getTime() - weeklyData[b].startDate.getTime();
    });
    
    // Prepare chart series
    const categories = sortedWeeks.map(week => {
      const startDate = weeklyData[week].startDate;
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      return `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getDate()} - ${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getDate()}`;
    });
    
    const withinKPISeries = sortedWeeks.map(week => weeklyData[week].withinKPI);
    const exceededKPISeries = sortedWeeks.map(week => weeklyData[week].exceededKPI);
    const kpiPercentageSeries = sortedWeeks.map(week => {
      const total = weeklyData[week].total;
      return total > 0 ? Math.round((weeklyData[week].withinKPI / total) * 100) : 0;
    });
    
    return {
      categories,
      series: [
        { name: 'Within KPI', data: withinKPISeries, type: 'column' },
        { name: 'Exceeded KPI', data: exceededKPISeries, type: 'column' },
        { name: 'KPI Percentage', data: kpiPercentageSeries, type: 'line', yAxis: 1 }
      ]
    };
  }
  
  private processKpiMonthlyData(data: any[]) {
    // Group data by month
    const monthlyData = {};
    
    // Initialize data structure with empty arrays
    data.forEach(complaint => {
      const createdAt = new Date(complaint.createdAt);
      const year = createdAt.getFullYear();
      const month = createdAt.getMonth() + 1; // 1-12
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          total: 0,
          withinKPI: 0,
          exceededKPI: 0
        };
      }
      
      monthlyData[monthKey].total++;
      
      // Check if complaint has metadata.escalation set to true
      if (complaint.metadata && complaint.metadata.escalation === true) {
        monthlyData[monthKey].exceededKPI++;
      } else {
        monthlyData[monthKey].withinKPI++;
      }
    });
    
    // Sort months
    const sortedMonths = Object.keys(monthlyData).sort();
    
    // Prepare chart series
    const categories = sortedMonths.map(month => {
      const [year, monthNum] = month.split('-').map(Number);
      const date = new Date(year, monthNum - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    });
    
    const withinKPISeries = sortedMonths.map(month => monthlyData[month].withinKPI);
    const exceededKPISeries = sortedMonths.map(month => monthlyData[month].exceededKPI);
    const kpiPercentageSeries = sortedMonths.map(month => {
      const total = monthlyData[month].total;
      return total > 0 ? Math.round((monthlyData[month].withinKPI / total) * 100) : 0;
    });
    
    return {
      categories,
      series: [
        { name: 'Within KPI', data: withinKPISeries, type: 'column' },
        { name: 'Exceeded KPI', data: exceededKPISeries, type: 'column' },
        { name: 'KPI Percentage', data: kpiPercentageSeries, type: 'line', yAxis: 1 }
      ]
    };
  }

  // Helper method to get week number
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Helper method to get start date of a week
  private getStartDateOfWeek(year: number, weekNumber: number): Date {
    const firstDayOfYear = new Date(year, 0, 1);
    const dayOffset = firstDayOfYear.getDay() || 7;
    const firstWeekStart = new Date(year, 0, 1 + (8 - dayOffset));
    const result = new Date(firstWeekStart);
    result.setDate(firstWeekStart.getDate() + (weekNumber - 1) * 7);
    return result;
  }

  private processNonEscalatedComplaintsData(data: any[], periodType: string = 'Monthly') {
    // ... existing code ...
  }

  async getShopsComplaintsReportData(filters: ComplaintChartDto) {
    try {
      // Build the query
      const query: any = {
        bool: {
          filter: [
            // Filter for shop complaints only - using the category.name.en field
            {
              match: {
                'type': 'Shops Complaint'
              }
            }
          ]
        }
      };

      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'customer.age': {} } };
        if (filters.minAge) ageRange.range['customer.age'].gte = filters.minAge;
        if (filters.maxAge) ageRange.range['customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'customer.gender.keyword': filters.gender }
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
        index: 'complaints',
        body: {
          query,
          size: 10000 // Get all matching documents
        }
      });

      const hits = result.body.hits.hits.map((hit: any) => hit._source);
      
      // Process data based on the period type
      const chartData = this.processShopsChartData(hits, filters.period);
      
      return {
        success: true,
        data: {
          shopsComplaintData: chartData
        }
      };
    } catch (error) {
      console.error('Error generating shop complaints report data:', error);
      return {
        success: false,
        message: 'Error generating shop complaints report data',
        error: error.message || error
      };
    }
  }

  private processShopsChartData(data: any[], periodType: string = 'Monthly') {
    let processedData: any;
    
    switch (periodType) {
      case 'Daily':
        processedData = this.processShopsDailyData(data);
        break;
      case 'Weekly':
        processedData = this.processShopsWeeklyData(data);
        break;
      case 'Monthly':
      default:
        processedData = this.processShopsMonthlyData(data);
        break;
    }
    
    return processedData;
  }

  private processShopsDailyData(data: any[]) {
    // Group by day
    const groupedByDay: Record<string, Record<string, number>> = {};
    const shopNames = new Set<string>();
    
    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = {};
    }
    
    // Group data by shop and day
    data.forEach(item => {
      if (item.touchpoint && item.touchpoint.name) {
        const date = moment(item.createdAt).format('YYYY-MM-DD');
        const shopName = item.touchpoint.name.en || item.touchpoint.name.ar || 'Unknown Shop';
        
        shopNames.add(shopName);
        
        if (moment(date).isAfter(moment().subtract(30, 'days'))) {
          if (!groupedByDay[date]) {
            groupedByDay[date] = {};
          }
          
          if (!groupedByDay[date][shopName]) {
            groupedByDay[date][shopName] = 0;
          }
          
          groupedByDay[date][shopName] += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) => moment(a).diff(moment(b)));
    const series = Array.from(shopNames).map(shopName => {
      return {
        name: shopName,
        data: categories.map(date => groupedByDay[date][shopName] || 0)
      };
    });
    
    return {
      categories,
      series
    };
  }

  private processShopsWeeklyData(data: any[]) {
    // Group by week and shop
    const groupedByWeek: Record<string, Record<string, number>> = {};
    const shopNames = new Set<string>();
    
    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = {};
    }
    
    // Group data by shop and week
    data.forEach(item => {
      if (item.touchpoint && item.touchpoint.name) {
        const itemDate = moment(item.createdAt);
        const startOfWeek = moment(itemDate).startOf('week');
        const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
        const shopName = item.touchpoint.name.en || item.touchpoint.name.ar || 'Unknown Shop';
        
        shopNames.add(shopName);
        
        if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
          if (!groupedByWeek[weekLabel]) {
            groupedByWeek[weekLabel] = {};
          }
          
          if (!groupedByWeek[weekLabel][shopName]) {
            groupedByWeek[weekLabel][shopName] = 0;
          }
          
          groupedByWeek[weekLabel][shopName] += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = Array.from(shopNames).map(shopName => {
      return {
        name: shopName,
        data: categories.map(week => groupedByWeek[week][shopName] || 0)
      };
    });
    
    return {
      categories,
      series
    };
  }

  private processShopsMonthlyData(data: any[]) {
    // Group by month and shop
    const groupedByMonth: Record<string, Record<string, number>> = {};
    const shopNames = new Set<string>();
    
    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = {};
    }
    
    // Group data by shop and month
    data.forEach(item => {
      if (item.touchpoint && item.touchpoint.name) {
        const month = moment(item.createdAt).format('YYYY-MM');
        const monthLabel = moment(month).format('MMM YYYY');
        const shopName = item.touchpoint.name.en || item.touchpoint.name.ar || 'Unknown Shop';
        
        shopNames.add(shopName);
        
        if (moment(month).isAfter(moment().subtract(12, 'months'))) {
          if (!groupedByMonth[monthLabel]) {
            groupedByMonth[monthLabel] = {};
          }
          
          if (!groupedByMonth[monthLabel][shopName]) {
            groupedByMonth[monthLabel][shopName] = 0;
          }
          
          groupedByMonth[monthLabel][shopName] += 1;
        }
      }
    });
    
    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = Array.from(shopNames).map(shopName => {
      return {
        name: shopName,
        data: categories.map(month => groupedByMonth[month][shopName] || 0)
      };
    });
    
    return {
      categories,
      series
    };
  }
} 