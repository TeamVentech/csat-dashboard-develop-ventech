import { Injectable } from '@nestjs/common';
import { ElasticService } from '../../ElasticSearch/elasticsearch.service';
import * as moment from 'moment';

@Injectable()
export class HandfreeStatisticsService {
  constructor(private readonly elasticSearchService: ElasticService) {}

  async getHandfreeChartData(filters: {
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
          must: [{ match: { 'type.keyword': 'Handsfree Request' } }],
          filter: [],
        },
      };

      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge)
          ageRange.range['metadata.customer.age'].gte = filters.minAge;
        if (filters.maxAge)
          ageRange.range['metadata.customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender.keyword': filters.gender },
        });
      }

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { createdAt: {} } };
        if (filters.fromDate)
          dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        query.bool.filter.push(dateRange);
      }

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 10000, // Get all matching documents
        },
      });
      const hits = result.body.hits.hits.map((hit: any) => hit._source);
      const chartData = this.processHandfreeChartData(hits, filters.period);

      return {
        success: true,
        data: {
          handfreeData: chartData,
        },
      };
    } catch (error) {
      console.error('Error generating handfree chart data:', error);
      return {
        success: false,
        message: 'Error generating handfree chart data',
        error: error.message || error,
      };
    }
  }
  private processHandfreeChartData(
    data: any[],
    periodType: string = 'Monthly',
  ) {
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
    const groupedByDay: Record<string, { Handsfree: number }> = {};

    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { Handsfree: 0 };
    }

    // Group data
    data.forEach((item) => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');

      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { Handsfree: 0 };
        }
        groupedByDay[date].Handsfree += 1;
      }
    });

    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) =>
      moment(a).diff(moment(b)),
    );
    const series = [
      {
        name: 'Handsfree',
        data: categories.map((date) => groupedByDay[date].Handsfree),
      },
    ];

    return {
      categories,
      series,
    };
  }

  private processWeeklyData(data: any[]) {
    // Group by week and type (Power Bank)
    const groupedByWeek: Record<string, { Handsfree: number }> = {};

    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { Handsfree: 0 };
    }

    // Group data
    data.forEach((item) => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const type = item.metadata?.type || 'Unknown';

      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { Handsfree: 0 };
        }

        if (type === 'Handsfree') {
          groupedByWeek[weekLabel].Handsfree += 1;
        }
      }
    });

    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Handsfree',
        data: categories.map((week) => groupedByWeek[week].Handsfree),
      },
    ];

    return {
      categories,
      series,
    };
  }

  private processMonthlyData(data: any[]) {
    // Group by month and type (Power Bank)
    const groupedByMonth: Record<string, { Handsfree: number }> = {};

    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { Handsfree: 0 };
    }

    // Group data
    data.forEach((item) => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const type = item.metadata?.type || 'Unknown';

      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { Handsfree: 0 };
        }

        if (type === 'Handsfree') {
          groupedByMonth[monthLabel].Handsfree += 1;
        }
      }
    });

    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Handsfree',
        data: categories.map((month) => groupedByMonth[month].Handsfree),
      },
    ];

    return {
      categories,
      series,
    };
  }

  //////////////////////////////////////////////

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
            { match: { 'type.keyword': 'Handsfree Request' } },
            { match: { 'state.keyword': 'Bags Returned' } }, // Only consider completed requests
          ],
          filter: [],
        },
      };

      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge)
          ageRange.range['metadata.customer.age'].gte = filters.minAge;
        if (filters.maxAge)
          ageRange.range['metadata.customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender.keyword': filters.gender },
        });
      }

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { createdAt: {} } };
        if (filters.fromDate)
          dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        query.bool.filter.push(dateRange);
      }

      // Must have return date and time
      query.bool.filter.push({
        exists: { field: 'metadata.returnDate' },
      });
      query.bool.filter.push({
        exists: { field: 'metadata.returnTime' },
      });

      // Execute search query

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 10000, // Get all matching documents
        },
      });
      const hits = result.body.hits.hits.map((hit: any) => hit._source);

      // Filter out invalid data
      const validData = hits.filter(
        (item) =>
          item.metadata &&
          item.metadata.returnDate &&
          item.metadata.returnTime &&
          item.createdAt,
      );

      // Process data for chart based on the period type
      const durationData = this.processAverageDurationData(
        validData,
        filters.period,
      );

      return {
        success: true,
        data: {
          handsfreeStats: {
            categories: durationData.categories,
            series: durationData.series,
            description:
              'This chart shows both the average duration in minutes and the count of requests for handsfree services',
          },
        },
      };
    } catch (error) {
      console.error('Error generating average duration data:', error);
      return {
        success: false,
        message: 'Error generating average duration data',
        error: error.message || error,
      };
    }
  }

  private processAverageDurationData(
    data: any[],
    periodType: string = 'Monthly',
  ) {
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
      const returnDateTime = moment(
        `${returnDate} ${returnTime}`,
        'YYYY-MM-DD HH:mm',
      );

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
    const groupedByDay: Record<
      string,
      {
        Handsfree: { totalDuration: number; count: number };
      }
    > = {};

    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = {
        Handsfree: { totalDuration: 0, count: 0 },
      };
    }

    // Group data
    data.forEach((item) => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const durationMinutes = this.calculateDurationInMinutes(item);

      if (
        durationMinutes &&
        moment(date).isAfter(moment().subtract(30, 'days'))
      ) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = {
            Handsfree: { totalDuration: 0, count: 0 },
          };
        }

        groupedByDay[date].Handsfree.totalDuration += durationMinutes;
        groupedByDay[date].Handsfree.count += 1;
      }
    });

    // Calculate averages and format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) =>
      moment(a).diff(moment(b)),
    );
    const series = [
      {
        name: 'Handsfree - Average Duration (minutes)',
        data: categories.map((date) => {
          const group = groupedByDay[date].Handsfree;
          return group.count > 0
            ? parseFloat((group.totalDuration / group.count).toFixed(1))
            : 0;
        }),
      },
      {
        name: 'Handsfree - Request Count',
        data: categories.map((date) => groupedByDay[date].Handsfree.count),
      },
    ];

    return {
      categories,
      series,
    };
  }

  private processWeeklyDurationData(data: any[]) {
    // Group by week and type (Power Bank)
    const groupedByWeek: Record<
      string,
      {
        Handsfree: { totalDuration: number; count: number };
      }
    > = {};

    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = {
        Handsfree: { totalDuration: 0, count: 0 },
      };
    }

    // Group data
    data.forEach((item) => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const durationMinutes = this.calculateDurationInMinutes(item);

      if (durationMinutes && itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = {
            Handsfree: { totalDuration: 0, count: 0 },
          };
        }

        groupedByWeek[weekLabel].Handsfree.totalDuration += durationMinutes;
        groupedByWeek[weekLabel].Handsfree.count += 1;
      }
    });

    // Calculate averages and format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Handsfree - Average Duration (minutes)',
        data: categories.map((week) => {
          const group = groupedByWeek[week].Handsfree;
          return group.count > 0
            ? parseFloat((group.totalDuration / group.count).toFixed(1))
            : 0;
        }),
      },
      {
        name: 'Handsfree - Request Count',
        data: categories.map((week) => groupedByWeek[week].Handsfree.count),
      },
    ];

    return {
      categories,
      series,
    };
  }

  private processMonthlyDurationData(data: any[]) {
    // Group by month and type (Power Bank)
    const groupedByMonth: Record<
      string,
      {
        Handsfree: { totalDuration: number; count: number };
      }
    > = {};

    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = {
        Handsfree: { totalDuration: 0, count: 0 },
      };
    }

    // Group data
    data.forEach((item) => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const durationMinutes = this.calculateDurationInMinutes(item);

      if (
        durationMinutes &&
        moment(month).isAfter(moment().subtract(12, 'months'))
      ) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = {
            Handsfree: { totalDuration: 0, count: 0 },
          };
        }
        groupedByMonth[monthLabel].Handsfree.totalDuration += durationMinutes;
        groupedByMonth[monthLabel].Handsfree.count += 1;
      }
    });

    // Calculate averages and format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Handsfree - Average Duration (minutes)',
        data: categories.map((month) => {
          const group = groupedByMonth[month].Handsfree;
          return group.count > 0
            ? parseFloat((group.totalDuration / group.count).toFixed(1))
            : 0;
        }),
      },
      {
        name: 'Handsfree - Request Count',
        data: categories.map((month) => groupedByMonth[month].Handsfree.count),
      },
    ];

    return {
      categories,
      series,
    };
  }
  //////////////////////////////




  async getDeliveryPickupServicesData(filtersd) {
    try {
      // Build the query
      const query: any = {
        bool: {
          must: [{ match: { 'type.keyword': 'Handsfree Request' } }],
          should: [
            { match: { 'metadata.delivery': true } },
            { match: { 'metadata.pickUp': true } },
          ],
          minimum_should_match: 1,
          filter: [],
        },
      };
      const filters = filtersd.params;
      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge)
          ageRange.range['metadata.customer.age'].gte = filters.minAge;
        if (filters.maxAge)
          ageRange.range['metadata.customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender.keyword': filters.gender },
        });
      }

      // Add request source filter if provided
      if (filters.requestSource) {
        query.bool.filter.push({
          match: { 'metadata.request_source.keyword': filters.requestSource },
        });
      }

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { createdAt: {} } };
        if (filters.fromDate)
          dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        query.bool.filter.push(dateRange);
      }

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 10000, // Get all matching documents
        },
      });
      const hits = result.body.hits.hits.map((hit: any) => hit._source);

      // Filter out invalid data
      const validData = hits.filter(
        (item) =>
          item.metadata &&
          (item.metadata.delivery === true || item.metadata.pickUp === true) &&
          item.createdAt,
      );

      // Process data for chart based on the period type
      const chartData = this.processDeliveryPickupServicesData(
        validData,
        filters.period,
      );
      const tableData = this.createDeliveryPickupServicesTableData(
        validData,
        filters.period,
        {
          minAge: filters.minAge,
          maxAge: filters.maxAge,
          gender: filters.gender,
          requestSource: filters.requestSource,
        },
      );

      // Additional statistics
      const deliveryStats = this.calculateDeliveryPickupStats(validData);

      return {
        success: true,
        data: {
          deliveryPickupStats: {
            chart: chartData,
            table: tableData,
            summary: deliveryStats,
          },
        },
      };
    } catch (error) {
      console.error('Error generating delivery/pickup services data:', error);
      return {
        success: false,
        message: 'Error generating delivery/pickup services data',
        error: error.message || error,
      };
    }
  }

  private calculateDeliveryPickupStats(data: any[]) {
    const stats = {
      totalCount: data.length,
      deliveryOnlyCount: 0,
      pickupOnlyCount: 0,
      bothDeliveryAndPickupCount: 0,
      handsfreeCount: 0,
      requestSources: {
        'QR Code': 0,
        Hotline: 0,
        'CC Desk': 0,
        Other: 0,
      },
    };

    data.forEach((item) => {
      const hasDelivery = item.metadata?.delivery === true;
      const hasPickup = item.metadata?.pickUp === true;
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
      stats.handsfreeCount++;

      // Count by request source
      if (
        requestSource === 'QR Code' ||
        requestSource === 'Hotline' ||
        requestSource === 'CC Desk'
      ) {
        stats.requestSources[requestSource]++;
      } else {
        stats.requestSources['Other']++;
      }
    });

    return stats;
  }

  private getAgeRangeText(
    filters: { minAge?: number; maxAge?: number; gender?: string } = {},
  ): string {
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


  private processDeliveryPickupServicesData(
    data: any[],
    periodType: string = 'Monthly',
  ) {
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
    const groupedByDay: Record<string, { Handsfree: number }> = {};

    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { Handsfree: 0 };
    }

    // Group data
    data.forEach((item) => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');

      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = { Handsfree: 0 };
        }
        groupedByDay[date].Handsfree += 1;
      }
    });

    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) =>
      moment(a).diff(moment(b)),
    );
    const series = [
      {
        name: 'Handsfree',
        data: categories.map((date) => groupedByDay[date].Handsfree),
      },
    ];

    return {
      categories,
      series,
    };
  }

  private processWeeklyDeliveryPickupServicesData(data: any[]) {
    // Group by week
    const groupedByWeek: Record<string, { Handsfree: number }> = {};

    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = { Handsfree: 0 };
    }

    // Group data
    data.forEach((item) => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;

      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = { Handsfree: 0 };
        }

        groupedByWeek[weekLabel].Handsfree += 1;
      }
    });

    // Format for chart
    const categories = Object.keys(groupedByWeek);
    const series = [
      {
        name: 'Handsfree',
        data: categories.map((week) => groupedByWeek[week].Handsfree),
      },
    ];

    return {
      categories,
      series,
    };
  }

  private processMonthlyDeliveryPickupServicesData(data: any[]) {
    // Group by month
    const groupedByMonth: Record<string, { Handsfree: number }> = {};

    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = { Handsfree: 0 };
    }

    // Group data
    data.forEach((item) => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');

      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = { Handsfree: 0 };
        }

        groupedByMonth[monthLabel].Handsfree += 1;
      }
    });

    // Format for chart
    const categories = Object.keys(groupedByMonth);
    const series = [
      {
        name: 'Handsfree',
        data: categories.map((month) => groupedByMonth[month].Handsfree),
      },
    ];

    return {
      categories,
      series,
    };
  }

  private createDeliveryPickupServicesTableData(
    data: any[],
    periodType: string = 'Monthly',
    filters: {
      minAge?: number;
      maxAge?: number;
      gender?: string;
      requestSource?: string;
    } = {},
  ) {
    let tableData = [];

    switch (periodType) {
      case 'Daily':
        tableData = this.createDailyDeliveryPickupServicesTableData(
          data,
          filters,
        );
        break;
      case 'Weekly':
        tableData = this.createWeeklyDeliveryPickupServicesTableData(
          data,
          filters,
        );
        break;
      case 'Monthly':
      default:
        tableData = this.createMonthlyDeliveryPickupServicesTableData(
          data,
          filters,
        );
        break;
    }

    return tableData;
  }

  private createDailyDeliveryPickupServicesTableData(
    data: any[],
    filters: {
      minAge?: number;
      maxAge?: number;
      gender?: string;
      requestSource?: string;
    } = {},
  ) {
    // Group by day
    const groupedByDay: Record<
      string,
      {
        Handsfree: {
          delivery: number;
          pickup: number;
          both: number;
          total: number;
        };
      }
    > = {};

    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = {
        Handsfree: { delivery: 0, pickup: 0, both: 0, total: 0 },
      };
    }

    // Group data
    data.forEach((item) => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const hasDelivery = item.metadata?.delivery === true;
      const hasPickup = item.metadata?.pickUp === true;

      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = {
            Handsfree: { delivery: 0, pickup: 0, both: 0, total: 0 },
          };
        }

        if (hasDelivery && hasPickup) {
          groupedByDay[date].Handsfree.both += 1;
        } else if (hasDelivery) {
          groupedByDay[date].Handsfree.delivery += 1;
        } else if (hasPickup) {
          groupedByDay[date].Handsfree.pickup += 1;
        }
        groupedByDay[date].Handsfree.total += 1;
      }
    });

    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    const requestSourceText = filters.requestSource
      ? `${filters.requestSource}`
      : '';

    return Object.keys(groupedByDay)
      .sort((a, b) => moment(a).diff(moment(b)))
      .filter((date) => {
        const day = groupedByDay[date];
        return day.Handsfree.total > 0;
      })
      .map((date) => {
        const day = groupedByDay[date];
        return {
          period: date,
          handsfree: {
            deliveryOnly: day.Handsfree.delivery,
            pickupOnly: day.Handsfree.pickup,
            both: day.Handsfree.both,
            total: day.Handsfree.total,
          },
          ageRange: ageRangeText,
          gender: genderText,
          requestSource: requestSourceText,
        };
      });
  }

  private createWeeklyDeliveryPickupServicesTableData(
    data: any[],
    filters: {
      minAge?: number;
      maxAge?: number;
      gender?: string;
      requestSource?: string;
    } = {},
  ) {
    // Group by week
    const groupedByWeek: Record<
      string,
      {
        Handsfree: {
          delivery: number;
          pickup: number;
          both: number;
          total: number;
        };
      }
    > = {};

    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = {
        Handsfree: { delivery: 0, pickup: 0, both: 0, total: 0 },
      };
    }

    // Group data
    data.forEach((item) => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const hasDelivery = item.metadata?.delivery === true;
      const hasPickup = item.metadata?.pickUp === true;

      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = {
            Handsfree: { delivery: 0, pickup: 0, both: 0, total: 0 },
          };
        }

          if (hasDelivery && hasPickup) {
            groupedByWeek[weekLabel].Handsfree.both += 1;
          } else if (hasDelivery) {
            groupedByWeek[weekLabel].Handsfree.delivery += 1;
          } else if (hasPickup) {
            groupedByWeek[weekLabel].Handsfree.pickup += 1;
          }
          groupedByWeek[weekLabel].Handsfree.total += 1;
        
      }
    });

    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    const requestSourceText = filters.requestSource
      ? `${filters.requestSource}`
      : '';

    return Object.keys(groupedByWeek)
      .filter((week) => {
        const weekData = groupedByWeek[week];
        return weekData.Handsfree.total > 0;
      })
      .map((week) => {
        const weekData = groupedByWeek[week];
        return {
          period: week,
          handsfree: {
            deliveryOnly: weekData.Handsfree.delivery,
            pickupOnly: weekData.Handsfree.pickup,
            both: weekData.Handsfree.both,
            total: weekData.Handsfree.total,
          },
          ageRange: ageRangeText,
          gender: genderText,
          requestSource: requestSourceText,
        };
      });
  }

  private createMonthlyDeliveryPickupServicesTableData(
    data: any[],
    filters: {
      minAge?: number;
      maxAge?: number;
      gender?: string;
      requestSource?: string;
    } = {},
  ) {
    // Group by month
    const groupedByMonth: Record<
      string,
      {
        Handsfree: {
          delivery: number;
          pickup: number;
          both: number;
          total: number;
        };
      }
    > = {};

    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = {
        Handsfree: { delivery: 0, pickup: 0, both: 0, total: 0 },
      };
    }

    // Group data
    data.forEach((item) => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const hasDelivery = item.metadata?.delivery === true;
      const hasPickup = item.metadata?.pickUp === true;

      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = {
            Handsfree: { delivery: 0, pickup: 0, both: 0, total: 0 },
          };
        }

        if (hasDelivery && hasPickup) {
          groupedByMonth[monthLabel].Handsfree.both += 1;
        } else if (hasDelivery) {
            groupedByMonth[monthLabel].Handsfree.delivery += 1;
        } else if (hasPickup) {
          groupedByMonth[monthLabel].Handsfree.pickup += 1;
        }
        groupedByMonth[monthLabel].Handsfree.total += 1;
      }
    });

    // Format for table with filter info
    const ageRangeText = this.getAgeRangeText(filters);
    const genderText = filters.gender ? `${filters.gender}` : '';
    const requestSourceText = filters.requestSource
      ? `${filters.requestSource}`
      : '';

    return Object.keys(groupedByMonth)
      .filter((month) => {
        const monthData = groupedByMonth[month];
        return monthData.Handsfree.total > 0;
      })
      .map((month) => {
        const monthData = groupedByMonth[month];
        return {
          period: month,
          handsfree: {
            deliveryOnly: monthData.Handsfree.delivery,
            pickupOnly: monthData.Handsfree.pickup,
            both: monthData.Handsfree.both,
            total: monthData.Handsfree.total,
          },
          ageRange: ageRangeText,
          gender: genderText,
          requestSource: requestSourceText,
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
          must: [{ match: { 'type.keyword': 'Handsfree Request' } }],
          filter: [],
        },
      };

      // Add age range filter if provided
      if (filters.minAge || filters.maxAge) {
        const ageRange: any = { range: { 'metadata.customer.age': {} } };
        if (filters.minAge)
          ageRange.range['metadata.customer.age'].gte = filters.minAge;
        if (filters.maxAge)
          ageRange.range['metadata.customer.age'].lte = filters.maxAge;
        query.bool.filter.push(ageRange);
      }

      // Add gender filter if provided
      if (filters.gender) {
        query.bool.filter.push({
          match: { 'metadata.customer.gender.keyword': filters.gender },
        });
      }

      // Add date range filter if provided
      if (filters.fromDate || filters.toDate) {
        const dateRange: any = { range: { createdAt: {} } };
        if (filters.fromDate)
          dateRange.range['createdAt'].gte = filters.fromDate;
        if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
        query.bool.filter.push(dateRange);
      }

      // Must have request_source field
      query.bool.filter.push({
        exists: { field: 'metadata.request_source' },
      });

      // Execute search query
      const result = await this.elasticSearchService.getSearchService().search({
        index: 'services',
        body: {
          query,
          size: 10000, // Get all matching documents
        },
      });
      const hits = result.body.hits.hits.map((hit: any) => hit._source);

      // Filter out invalid data
      const validData = hits.filter(
        (item) =>
          item.metadata && item.metadata.request_source && item.createdAt,
      );

      // Process data for chart based on the period type
      const chartData = this.processRequestSourceReportData(
        validData,
        filters.period,
      );

      // Generate summary data for each request source
      const summary = this.generateRequestSourceSummary(validData);

      return {
        success: true,
        data: {
          requestSourceReport: {
            chart: chartData,
            summary: summary,
          },
        },
      };
    } catch (error) {
      console.error('Error generating request source report data:', error);
      return {
        success: false,
        message: 'Error generating request source report data',
        error: error.message || error,
      };
    }
  }

  private generateRequestSourceSummary(data: any[]) {
    const summary = {
      totalCount: data.length,
      sourceCounts: {
        'QR Code': 0,
        Hotline: 0,
        'CC Desk': 0,
        Other: 0,
      },
      handsfreeCounts: {
        'QR Code': 0,
        Hotline: 0,
        'CC Desk': 0,
        Other: 0,
      },
    };

    data.forEach((item) => {
      const requestSource = item.metadata?.request_source || 'Other';
      const sourceKey = ['QR Code', 'Hotline', 'CC Desk'].includes(
        requestSource,
      )
        ? requestSource
        : 'Other';
      summary.sourceCounts[sourceKey]++;
      summary.handsfreeCounts[sourceKey]++;
    });

    return summary;
  }

  private processRequestSourceReportData(
    data: any[],
    periodType: string = 'Monthly',
  ) {
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
    const groupedByDay: Record<
      string,
      { 'QR Code': number; Hotline: number; 'CC Desk': number; Other: number }
    > = {};

    // Initialize last 30 days
    const today = moment();
    for (let i = 29; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
      groupedByDay[date] = { 'QR Code': 0, Hotline: 0, 'CC Desk': 0, Other: 0 };
    }

    // Group data
    data.forEach((item) => {
      const date = moment(item.createdAt).format('YYYY-MM-DD');
      const requestSource = item.metadata?.request_source || 'Other';

      if (moment(date).isAfter(moment().subtract(30, 'days'))) {
        if (!groupedByDay[date]) {
          groupedByDay[date] = {
            'QR Code': 0,
            Hotline: 0,
            'CC Desk': 0,
            Other: 0,
          };
        }

        if (['QR Code', 'Hotline', 'CC Desk'].includes(requestSource)) {
          groupedByDay[date][requestSource] += 1;
        } else {
          groupedByDay[date]['Other'] += 1;
        }
      }
    });

    // Format for chart
    const categories = Object.keys(groupedByDay).sort((a, b) =>
      moment(a).diff(moment(b)),
    );
    const series = [
      {
        name: 'QR Code',
        data: categories.map((date) => groupedByDay[date]['QR Code']),
      },
      {
        name: 'Hotline',
        data: categories.map((date) => groupedByDay[date]['Hotline']),
      },
      {
        name: 'CC Desk',
        data: categories.map((date) => groupedByDay[date]['CC Desk']),
      },
      {
        name: 'Other',
        data: categories.map((date) => groupedByDay[date]['Other']),
      },
    ];

    return {
      categories,
      series,
    };
  }

  private processWeeklyRequestSourceData(data: any[]) {
    // Group by week and request source
    const groupedByWeek: Record<
      string,
      { 'QR Code': number; Hotline: number; 'CC Desk': number; Other: number }
    > = {};

    // Initialize last 12 weeks
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = moment(today).subtract(i, 'weeks').startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      groupedByWeek[weekLabel] = {
        'QR Code': 0,
        Hotline: 0,
        'CC Desk': 0,
        Other: 0,
      };
    }

    // Group data
    data.forEach((item) => {
      const itemDate = moment(item.createdAt);
      const startOfWeek = moment(itemDate).startOf('week');
      const weekLabel = `${startOfWeek.format('MMM DD')} - ${moment(startOfWeek).endOf('week').format('MMM DD')}`;
      const requestSource = item.metadata?.request_source || 'Other';

      if (itemDate.isAfter(moment().subtract(12, 'weeks'))) {
        if (!groupedByWeek[weekLabel]) {
          groupedByWeek[weekLabel] = {
            'QR Code': 0,
            Hotline: 0,
            'CC Desk': 0,
            Other: 0,
          };
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
        data: categories.map((week) => groupedByWeek[week]['QR Code']),
      },
      {
        name: 'Hotline',
        data: categories.map((week) => groupedByWeek[week]['Hotline']),
      },
      {
        name: 'CC Desk',
        data: categories.map((week) => groupedByWeek[week]['CC Desk']),
      },
      {
        name: 'Other',
        data: categories.map((week) => groupedByWeek[week]['Other']),
      },
    ];

    return {
      categories,
      series,
    };
  }

  private processMonthlyRequestSourceData(data: any[]) {
    // Group by month and request source
    const groupedByMonth: Record<
      string,
      { 'QR Code': number; Hotline: number; 'CC Desk': number; Other: number }
    > = {};

    // Initialize last 12 months
    const today = moment();
    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months').format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      groupedByMonth[monthLabel] = {
        'QR Code': 0,
        Hotline: 0,
        'CC Desk': 0,
        Other: 0,
      };
    }

    // Group data
    data.forEach((item) => {
      const month = moment(item.createdAt).format('YYYY-MM');
      const monthLabel = moment(month).format('MMM YYYY');
      const requestSource = item.metadata?.request_source || 'Other';

      if (moment(month).isAfter(moment().subtract(12, 'months'))) {
        if (!groupedByMonth[monthLabel]) {
          groupedByMonth[monthLabel] = {
            'QR Code': 0,
            Hotline: 0,
            'CC Desk': 0,
            Other: 0,
          };
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
        data: categories.map((month) => groupedByMonth[month]['QR Code']),
      },
      {
        name: 'Hotline',
        data: categories.map((month) => groupedByMonth[month]['Hotline']),
      },
      {
        name: 'CC Desk',
        data: categories.map((month) => groupedByMonth[month]['CC Desk']),
      },
      {
        name: 'Other',
        data: categories.map((month) => groupedByMonth[month]['Other']),
      },
    ];

    return {
      categories,
      series,
    };
  }

}
