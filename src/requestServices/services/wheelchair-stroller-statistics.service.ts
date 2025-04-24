import { Injectable } from '@nestjs/common';
import { ElasticService } from '../../ElasticSearch/elasticsearch.service';
import * as moment from 'moment';

@Injectable()
export class WheelchairStrollerStatisticsService {
  constructor(private readonly elasticSearchService: ElasticService) {}

  async getWheelchairStrollerChartData(filters: {
    fromDate?: string;
    toDate?: string;
    period?: string;
    serviceType?: string;
    minAge?: number;
    maxAge?: number;
    gender?: string;
  }) {
    try {
      // Build the query for wheelchair and stroller services
      const query: any = {
        bool: {
          must: [
            { match: { 'type.keyword': 'Wheelchair & Stroller Request' } }
          ],
          filter: []
        }
      };

      // Add service type filter if provided
      if (filters.serviceType) {
        query.bool.filter.push({
          match: { 'metadata.type': filters.serviceType }
        });
      }

      // Add age range filter if provided
      if (filters.minAge !== undefined || filters.maxAge !== undefined) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge !== undefined) ageRange.range['metadata.customer.age'].gte = filters.minAge;
        if (filters.maxAge !== undefined) ageRange.range['metadata.customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender': filters.gender }
        });
      }

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { createdAt: {} } };
        if (filters.fromDate) dateRange.range.createdAt.gte = filters.fromDate;
        if (filters.toDate) dateRange.range.createdAt.lte = filters.toDate;
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
      
      // Process chart data based on the period type
      const periodType = filters.period || 'Monthly';
      const chartData = this.processWheelchairStrollerChartData(hits, periodType);
      
      return {
        success: true,
        data: chartData
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

  private processWheelchairStrollerChartData(data: any[], periodType: string) {
    if (!data || data.length === 0) {
      return [];
    }

    // Filter data to only include create transactions
    const createData = data.filter(item => item.actions === 'In_Service' || item.state === 'In Service');

    // Group by period and service type
    let groupedData = {};

    switch (periodType) {
      case 'Daily':
        groupedData = this.groupByDay(createData);
        break;
      case 'Weekly':
        groupedData = this.groupByWeek(createData);
        break;
      case 'Monthly':
      default:
        groupedData = this.groupByMonth(createData);
        break;
    }

    // Convert to array format for chart
    const chartData = Object.entries(groupedData).map(([period, types]: [string, any]) => ({
      period,
      wheelchair: types.Wheelchair || 0,
      stroller: types.Stroller || 0,
      __typename: "WheelchairStrollerPeriodData"
    }));

    // Sort by period
    return chartData.sort((a, b) => a.period.localeCompare(b.period));
  }

  private groupByDay(data: any[]) {
    const groupedData = {};

    data.forEach(item => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const serviceType = item.metadata?.type || 'Unknown';

      if (!groupedData[date]) {
        groupedData[date] = {
          Wheelchair: 0,
          Stroller: 0
        };
      }

      if (serviceType === 'Wheelchair') {
        groupedData[date].Wheelchair++;
      } else if (serviceType === 'Stroller') {
        groupedData[date].Stroller++;
      }
    });

    return groupedData;
  }

  private groupByWeek(data: any[]) {
    const groupedData = {};

    data.forEach(item => {
      const weekStart = moment(item.createdAt).startOf('week').format('YYYY-MM-DD');
      const weekEnd = moment(item.createdAt).endOf('week').format('YYYY-MM-DD');
      const weekLabel = `${weekStart} to ${weekEnd}`;
      const serviceType = item.metadata?.type || 'Unknown';

      if (!groupedData[weekLabel]) {
        groupedData[weekLabel] = {
          Wheelchair: 0,
          Stroller: 0
        };
      }

      if (serviceType === 'Wheelchair') {
        groupedData[weekLabel].Wheelchair++;
      } else if (serviceType === 'Stroller') {
        groupedData[weekLabel].Stroller++;
      }
    });

    return groupedData;
  }

  private groupByMonth(data: any[]) {
    const groupedData = {};

    data.forEach(item => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const serviceType = item.metadata?.type || 'Unknown';

      if (!groupedData[month]) {
        groupedData[month] = {
          Wheelchair: 0,
          Stroller: 0
        };
      }

      if (serviceType === 'Wheelchair') {
        groupedData[month].Wheelchair++;
      } else if (serviceType === 'Stroller') {
        groupedData[month].Stroller++;
      }
    });

    return groupedData;
  }
} 