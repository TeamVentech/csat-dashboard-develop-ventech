import { Injectable } from '@nestjs/common';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';

@Injectable()
export class LostItemStatisticsService {
    constructor(private readonly elasticSearchService: ElasticService) {}
    
    async getLostItemChartData(filters: {
        minAge?: number;
        maxAge?: number;
        gender?: string;
        fromDate?: string;
        toDate?: string;
        locationId?: string;
        period?: string;
    }) {
        try {
            // Build the query
            const query: any = {
                bool: {
                    must: [
                        { match: { 'type.keyword': 'Lost Item' } }
                    ],
                    filter: []
                }
            };

            // Add customer age range filter if provided
            if (filters.minAge !== undefined || filters.maxAge !== undefined) {
                const ageRange: any = { range: { 'metadata.customer.age': {} } };
                if (filters.minAge !== undefined) ageRange.range['metadata.customer.age'].gte = filters.minAge.toString();
                if (filters.maxAge !== undefined) ageRange.range['metadata.customer.age'].lte = filters.maxAge.toString();
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
                const dateRange: any = { range: { 'metadata.date': {} } };
                if (filters.fromDate) dateRange.range['metadata.date'].gte = filters.fromDate;
                if (filters.toDate) dateRange.range['metadata.date'].lte = filters.toDate;
                query.bool.filter.push(dateRange);
            }

            // Add location filter if provided
            if (filters.locationId) {
                query.bool.filter.push({
                    match: { 'metadata.location.id': filters.locationId }
                });
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
            const chartData = this.processLostItemChartData(hits, filters.period);
            
            return {
                success: true,
                data: {
                    reportLostItemPeriod: chartData
                }
            };
        } catch (error) {
            console.error('Error generating lost item chart data:', error);
            return {
                success: false,
                message: 'Error generating lost item chart data',
                error: error.message || error
            };
        }
    }

    private processLostItemChartData(data: any[], periodType: string | undefined) {
        if (!data || data.length === 0) {
            return [];
        }

        switch (periodType) {
            case 'TimeOfDay':
                return this.processTimeOfDayData(data);
            case 'Monthly':
                return this.processMonthlyData(data);
            case 'Weekly':
                return this.processWeeklyData(data);
            default:
                return this.processMonthlyData(data); // Default to monthly
        }
    }

    private processTimeOfDayData(data: any[]) {
        // Find date range
        let minDate = null;
        let maxDate = null;
        
        data.forEach(item => {
            if (item.metadata && item.metadata.date) {
                const date = new Date(item.metadata.date);
                if (!minDate || date < minDate) minDate = new Date(date);
                if (!maxDate || date > maxDate) maxDate = new Date(date);
            }
        });
        
        // If no data or invalid dates, return empty array
        if (!minDate || !maxDate) {
            return [];
        }
        
        // Create map of all days in the range
        const dayMap = new Map();
        const currentDate = new Date(minDate);
        
        // Set time to 00:00:00 for proper day comparison
        currentDate.setHours(0, 0, 0, 0);
        maxDate.setHours(23, 59, 59, 999);
        
        while (currentDate <= maxDate) {
            const dayKey = currentDate.getDate().toString().padStart(2, '0') + ' ' + 
                          currentDate.toLocaleString('default', { month: 'long' });
            dayMap.set(dayKey, 0);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Count cases for each day
        data.forEach(item => {
            if (item.metadata && item.metadata.date) {
                const date = new Date(item.metadata.date);
                const dayKey = date.getDate().toString().padStart(2, '0') + ' ' + 
                              date.toLocaleString('default', { month: 'long' });
                
                if (dayMap.has(dayKey)) {
                    dayMap.set(dayKey, dayMap.get(dayKey) + 1);
                }
            }
        });
        
        // Convert map to array in the required format
        return Array.from(dayMap.entries()).map(([period, count]) => ({
            period,
            totalCases: count.toString(),
            __typename: "ReportPeriodLostItem"
        }));
    }

    private processMonthlyData(data: any[]) {
        // Find date range
        let minDate = null;
        let maxDate = null;
        
        data.forEach(item => {
            if (item.metadata && item.metadata.date) {
                const date = new Date(item.metadata.date);
                if (!minDate || date < minDate) minDate = new Date(date);
                if (!maxDate || date > maxDate) maxDate = new Date(date);
            }
        });
        
        // If no data or invalid dates, return empty array
        if (!minDate || !maxDate) {
            return [];
        }
        
        // Create map of all months in the range
        const monthMap = new Map();
        const currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
        
        while (currentDate <= endDate) {
            const monthKey = currentDate.toLocaleString('default', { month: 'long' }) + ' ' + 
                            currentDate.getFullYear();
            monthMap.set(monthKey, 0);
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        // Count cases for each month
        data.forEach(item => {
            if (item.metadata && item.metadata.date) {
                const date = new Date(item.metadata.date);
                const monthKey = date.toLocaleString('default', { month: 'long' }) + ' ' + 
                                date.getFullYear();
                
                if (monthMap.has(monthKey)) {
                    monthMap.set(monthKey, monthMap.get(monthKey) + 1);
                }
            }
        });
        
        // Convert map to array in the required format
        return Array.from(monthMap.entries()).map(([period, count]) => ({
            period,
            totalCases: count.toString(),
            __typename: "ReportPeriodLostItem"
        }));
    }

    private processWeeklyData(data: any[]) {
        // Find date range
        let minDate = null;
        let maxDate = null;
        
        data.forEach(item => {
            if (item.metadata && item.metadata.date) {
                const date = new Date(item.metadata.date);
                if (!minDate || date < minDate) minDate = new Date(date);
                if (!maxDate || date > maxDate) maxDate = new Date(date);
            }
        });
        
        // If no data or invalid dates, return empty array
        if (!minDate || !maxDate) {
            return [];
        }
        
        // Calculate min and max week numbers
        const startOfMinYear = new Date(minDate.getFullYear(), 0, 1);
        const daysMin = Math.floor((minDate.getTime() - startOfMinYear.getTime()) / (24 * 60 * 60 * 1000));
        const minWeek = Math.ceil(daysMin / 7);
        
        const startOfMaxYear = new Date(maxDate.getFullYear(), 0, 1);
        const daysMax = Math.floor((maxDate.getTime() - startOfMaxYear.getTime()) / (24 * 60 * 60 * 1000));
        const maxWeek = Math.ceil(daysMax / 7);
        
        // Create map of all weeks in the range
        const weekMap = new Map();
        
        // Handle case where min and max dates span different years
        if (minDate.getFullYear() === maxDate.getFullYear()) {
            // Same year
            for (let week = minWeek; week <= maxWeek; week++) {
                const weekKey = week.toString() + ' ' + minDate.getFullYear();
                weekMap.set(weekKey, 0);
            }
        } else {
            // Different years
            // Add weeks for first year
            for (let week = minWeek; week <= 52; week++) {
                const weekKey = week.toString() + ' ' + minDate.getFullYear();
                weekMap.set(weekKey, 0);
            }
            
            // Add weeks for years in between (if any)
            for (let year = minDate.getFullYear() + 1; year < maxDate.getFullYear(); year++) {
                for (let week = 1; week <= 52; week++) {
                    const weekKey = week.toString() + ' ' + year;
                    weekMap.set(weekKey, 0);
                }
            }
            
            // Add weeks for last year
            for (let week = 1; week <= maxWeek; week++) {
                const weekKey = week.toString() + ' ' + maxDate.getFullYear();
                weekMap.set(weekKey, 0);
            }
        }
        
        // Count cases for each week
        data.forEach(item => {
            if (item.metadata && item.metadata.date) {
                const date = new Date(item.metadata.date);
                const startOfYear = new Date(date.getFullYear(), 0, 1);
                const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                const weekNumber = Math.ceil(days / 7);
                
                const weekKey = weekNumber.toString() + ' ' + date.getFullYear();
                
                if (weekMap.has(weekKey)) {
                    weekMap.set(weekKey, weekMap.get(weekKey) + 1);
                }
            }
        });
        
        // Convert map to array in the required format
        return Array.from(weekMap.entries()).map(([period, count]) => ({
            period,
            totalCases: count.toString(),
            __typename: "ReportPeriodLostItem"
        }));
    }

    async getLostItemLocationData(
        filters: {
            locationType?: string;
            minAge?: number;
            maxAge?: number;
            gender?: string;
            fromDate?: string;
            toDate?: string;
        }
    ) {
        try {
            // Build the query
            const query: any = {
                bool: {
                    must: [
                        { match: { type: 'Lost Item' } }
                    ],
                    filter: []
                }
            };

            // Add customer age range filter if provided
            if (filters.minAge !== undefined || filters.maxAge !== undefined) {
                const ageRange: any = { range: { 'metadata.customer.age': {} } };
                if (filters.minAge !== undefined) ageRange.range['metadata.customer.age'].gte = filters.minAge.toString();
                if (filters.maxAge !== undefined) ageRange.range['metadata.customer.age'].lte = filters.maxAge.toString();
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
                const dateRange: any = { range: { 'metadata.date': {} } };
                if (filters.fromDate) dateRange.range['metadata.date'].gte = filters.fromDate;
                if (filters.toDate) dateRange.range['metadata.date'].lte = filters.toDate;
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
            
            // Process location data
            const locationData = this.processLocationData(hits, filters.locationType);
            
            return {
                success: true,
                data: {
                    locationDistribution: locationData
                }
            };
        } catch (error) {
            console.error('Error generating lost item location data:', error);
            return {
                success: false,
                message: 'Error generating lost item location data',
                error: error.message || error
            };
        }
    }

    private processLocationData(data: any[], locationType: string = 'lost') {
        if (!data || data.length === 0) {
            return [];
        }

        // Maps to track location counts
        const locationCountMap = new Map<string, number>();
        
        // Process data based on location type
        data.forEach(item => {
            if (!item.metadata) return;

            let location = null;
            
            if (locationType === 'found' && item.metadata.location_found) {
                // Use found location
                location = item.metadata.location_found;
            } else {
                // Default to lost location
                location = item.metadata.location;
            }
            
            if (location && location.tenant) {
                const locationName = `${location.floor} - ${location.tenant}`;
                
                if (!locationCountMap.has(locationName)) {
                    locationCountMap.set(locationName, 0);
                }
                
                locationCountMap.set(locationName, locationCountMap.get(locationName) + 1);
            }
        });
        
        // Convert map to array and sort by count in descending order
        const sortedLocations = Array.from(locationCountMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10) // Get top 10 locations
            .map(([location, count]) => ({
                location,
                count: count.toString(),
                __typename: "ItemLocationDistribution"
            }));
            
        return sortedLocations;
    }

    async getLostItemDurationData(
        filters: {
            minAge?: number;
            maxAge?: number;
            gender?: string;
            fromDate?: string;
            toDate?: string;
            period?: string;
        }
    ) {
        try {
            // Build the query - we only want Lost Item cases that are in "Article Found" state
            const query: any = {
                bool: {
                    must: [
                        { match: { 'type.keyword': 'Lost Item' } },
                        { match: { 'state.keyword': 'Article Found' } },
                        { exists: { field: 'metadata.date_found' } }
                    ],
                    filter: []
                }
            };

            // Add customer age range filter if provided
            if (filters.minAge !== undefined || filters.maxAge !== undefined) {
                const shouldQueries = [];
                
                // Handle numeric comparison
                const ageRange: any = { range: { 'metadata.customer.age': {} } };
                if (filters.minAge !== undefined) ageRange.range['metadata.customer.age'].gte = filters.minAge;
                if (filters.maxAge !== undefined) ageRange.range['metadata.customer.age'].lte = filters.maxAge;
                shouldQueries.push(ageRange);
                
                // Handle string comparison
                const ageRangeStr: any = { range: { 'metadata.customer.age': {} } };
                if (filters.minAge !== undefined) ageRangeStr.range['metadata.customer.age'].gte = filters.minAge.toString();
                if (filters.maxAge !== undefined) ageRangeStr.range['metadata.customer.age'].lte = filters.maxAge.toString();
                shouldQueries.push(ageRangeStr);
                
                query.bool.filter.push({
                    bool: {
                        should: shouldQueries,
                        minimum_should_match: 1
                    }
                });
            }

            // Add gender filter if provided
            if (filters.gender) {
                query.bool.filter.push({
                    match: { 'metadata.customer.gender': filters.gender }
                });
            }

            // Add date range filter if provided
            if (filters.fromDate || filters.toDate) {
                const dateRange: any = { range: { 'metadata.date': {} } };
                if (filters.fromDate) dateRange.range['metadata.date'].gte = filters.fromDate;
                if (filters.toDate) dateRange.range['metadata.date'].lte = filters.toDate;
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
            
            // Calculate duration statistics
            const durationData = this.processItemDurationData(hits, filters.period);
            
            return {
                success: true,
                data: {
                    durationStatistics: durationData
                }
            };
        } catch (error) {
            console.error('Error generating lost item duration data:', error);
            return {
                success: false,
                message: 'Error generating lost item duration data',
                error: error.message || error
            };
        }
    }

    private processItemDurationData(data: any[], periodType: string = 'Monthly') {
        if (!data || data.length === 0) {
            return {
                averageDuration: "0",
                breakdown: []
            };
        }

        // Calculate duration for each record
        const recordsWithDuration = data.map(item => {
            const createdDate = new Date(item.createdAt);
            const foundDate = new Date(item.metadata?.date_found);
            
            if (!isNaN(createdDate.getTime()) && !isNaN(foundDate.getTime())) {
                // Calculate duration in minutes
                const durationMinutes = Math.round((foundDate.getTime() - createdDate.getTime()) / (1000 * 60));
                
                return {
                    ...item,
                    durationMinutes
                };
            }
            return null;
        }).filter(item => item !== null);

        // Calculate overall average duration
        const totalMinutes = recordsWithDuration.reduce((sum, item) => sum + item.durationMinutes, 0);
        const averageDuration = recordsWithDuration.length > 0 
            ? (totalMinutes / recordsWithDuration.length).toFixed(0)
            : "0";

        // Group by period for breakdown
        let breakdown = [];
        
        switch (periodType) {
            case 'TimeOfDay':
                breakdown = this.getItemTimeOfDayDurationBreakdown(recordsWithDuration);
                break;
            case 'Monthly':
                breakdown = this.getItemMonthlyDurationBreakdown(recordsWithDuration);
                break;
            case 'Weekly':
                breakdown = this.getItemWeeklyDurationBreakdown(recordsWithDuration);
                break;
            default:
                breakdown = this.getItemMonthlyDurationBreakdown(recordsWithDuration);
        }

        return {
            averageDuration,
            breakdown
        };
    }

    private getItemTimeOfDayDurationBreakdown(data: any[]) {
        // Group by day
        const periodMap = new Map();
        
        data.forEach(item => {
            if (item.metadata && item.metadata.date) {
                const date = new Date(item.metadata.date);
                const periodKey = date.getDate().toString().padStart(2, '0') + ' ' + 
                                date.toLocaleString('default', { month: 'long' });
                
                if (!periodMap.has(periodKey)) {
                    periodMap.set(periodKey, {
                        totalMinutes: 0,
                        count: 0
                    });
                }
                
                const periodData = periodMap.get(periodKey);
                periodData.totalMinutes += item.durationMinutes;
                periodData.count += 1;
                periodMap.set(periodKey, periodData);
            }
        });
        
        // Convert map to array in the required format
        return Array.from(periodMap.entries())
            .map(([period, stats]) => ({
                period,
                averageDuration: stats.count > 0 ? Math.round(stats.totalMinutes / stats.count).toString() : "0",
                casesCount: stats.count.toString(),
                __typename: "ItemDurationBreakdown"
            }));
    }

    private getItemMonthlyDurationBreakdown(data: any[]) {
        // Group by month and year
        const periodMap = new Map();
        
        data.forEach(item => {
            if (item.metadata && item.metadata.date) {
                const date = new Date(item.metadata.date);
                const periodKey = date.toLocaleString('default', { month: 'long' }) + ' ' + 
                                date.getFullYear();
                
                if (!periodMap.has(periodKey)) {
                    periodMap.set(periodKey, {
                        totalMinutes: 0,
                        count: 0
                    });
                }
                
                const periodData = periodMap.get(periodKey);
                periodData.totalMinutes += item.durationMinutes;
                periodData.count += 1;
                periodMap.set(periodKey, periodData);
            }
        });
        
        // Convert map to array in the required format
        return Array.from(periodMap.entries())
            .map(([period, stats]) => ({
                period,
                averageDuration: stats.count > 0 ? Math.round(stats.totalMinutes / stats.count).toString() : "0",
                casesCount: stats.count.toString(),
                __typename: "ItemDurationBreakdown"
            }));
    }

    private getItemWeeklyDurationBreakdown(data: any[]) {
        // Group by week number and year
        const periodMap = new Map();
        
        data.forEach(item => {
            if (item.metadata && item.metadata.date) {
                const date = new Date(item.metadata.date);
                // Calculate week number
                const startOfYear = new Date(date.getFullYear(), 0, 1);
                const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                const weekNumber = Math.ceil(days / 7);
                
                const periodKey = weekNumber.toString() + ' ' + date.getFullYear();
                
                if (!periodMap.has(periodKey)) {
                    periodMap.set(periodKey, {
                        totalMinutes: 0,
                        count: 0
                    });
                }
                
                const periodData = periodMap.get(periodKey);
                periodData.totalMinutes += item.durationMinutes;
                periodData.count += 1;
                periodMap.set(periodKey, periodData);
            }
        });
        
        // Convert map to array in the required format
        return Array.from(periodMap.entries())
            .map(([period, stats]) => ({
                period,
                averageDuration: stats.count > 0 ? Math.round(stats.totalMinutes / stats.count).toString() : "0",
                casesCount: stats.count.toString(),
                __typename: "ItemDurationBreakdown"
            }));
    }

    async getLostItemStateChartData(
        filters: {
            fromDate?: string;
            toDate?: string;
            period?: string;
            type?: string;
        }
    ) {
        try {
            // Build the query
            const query: any = {
                bool: {
                    must: [
                        { match: { 'type.keyword': filters.type } }
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

            // Execute search query
            const result = await this.elasticSearchService.getSearchService().search({
                index: 'services',
                body: {
                    query,
                    size: 10000 // Get all matching documents
                }
            });
            const hits = result.body.hits.hits.map((hit: any) => hit._source);
            
            // Process state data
            const stateData = this.processStateData(hits, filters.period);
            
            return {
                success: true,
                data: {
                    stateDistribution: stateData
                }
            };
        } catch (error) {
            console.error('Error generating lost item state chart data:', error);
            return {
                success: false,
                message: 'Error generating lost item state chart data',
                error: error.message || error
            };
        }
    }

    private processStateData(data: any[], periodType: string = 'Monthly') {
        if (!data || data.length === 0) {
            return {
                overall: [],
                byPeriod: []
            };
        }

        // Count overall states
        const stateCountMap = new Map<string, number>();
        
        data.forEach(item => {
            const state = item.state || 'Unknown';
            
            if (!stateCountMap.has(state)) {
                stateCountMap.set(state, 0);
            }
            
            stateCountMap.set(state, stateCountMap.get(state) + 1);
        });
        
        // Convert overall map to array
        const overallData = Array.from(stateCountMap.entries())
            .map(([state, count]) => ({
                state,
                count: count.toString(),
                percentage: ((count / data.length) * 100).toFixed(1),
                __typename: "ItemStateDistribution"
            }));

        // Group by period
        let periodData = [];
        
        switch (periodType) {
            case 'TimeOfDay':
                periodData = this.getStateByDayBreakdown(data);
                break;
            case 'Monthly':
                periodData = this.getStateByMonthBreakdown(data);
                break;
            case 'Weekly':
                periodData = this.getStateByWeekBreakdown(data);
                break;
            default:
                periodData = this.getStateByMonthBreakdown(data);
        }

        return {
            overall: overallData,
            byPeriod: periodData
        };
    }

    private getStateByDayBreakdown(data: any[]) {
        // Group by day and state
        const periodMap = new Map();
        
        data.forEach(item => {
            if (item.createdAt) {
                const date = new Date(item.createdAt);
                const periodKey = date.getDate().toString().padStart(2, '0') + ' ' + 
                                date.toLocaleString('default', { month: 'long' });
                const state = item.state || 'Unknown';
                
                if (!periodMap.has(periodKey)) {
                    periodMap.set(periodKey, new Map<string, number>());
                }
                
                const stateMap = periodMap.get(periodKey);
                
                if (!stateMap.has(state)) {
                    stateMap.set(state, 0);
                }
                
                stateMap.set(state, stateMap.get(state) + 1);
            }
        });
        
        // Convert map to required format
        return Array.from(periodMap.entries())
            .map(([period, stateMap]) => {
                const totalCount = Array.from(stateMap.values()).reduce((sum: number, count: number) => sum + count, 0);
                
                return {
                    period,
                    states: Array.from(stateMap.entries()).map(([state, count]) => ({
                        state,
                        count: count.toString(),
                        percentage: (((count as number) / (totalCount as number)) * 100).toFixed(1),
                        __typename: "ItemStateDistribution"
                    }))
                };
            });
    }

    private getStateByMonthBreakdown(data: any[]) {
        // Group by month and state
        const periodMap = new Map();
        
        data.forEach(item => {
            if (item.createdAt) {
                const date = new Date(item.createdAt);
                const periodKey = date.toLocaleString('default', { month: 'long' }) + ' ' + 
                                date.getFullYear();
                const state = item.state || 'Unknown';
                
                if (!periodMap.has(periodKey)) {
                    periodMap.set(periodKey, new Map<string, number>());
                }
                
                const stateMap = periodMap.get(periodKey);
                
                if (!stateMap.has(state)) {
                    stateMap.set(state, 0);
                }
                
                stateMap.set(state, stateMap.get(state) + 1);
            }
        });
        
        // Convert map to required format
        return Array.from(periodMap.entries())
            .map(([period, stateMap]) => {
                const totalCount = Array.from(stateMap.values()).reduce((sum: number, count: number) => sum + count, 0);
                
                return {
                    period,
                    states: Array.from(stateMap.entries()).map(([state, count]) => ({
                        state,
                        count: count.toString(),
                        percentage: (((count as number) / (totalCount as number)) * 100).toFixed(1),
                        __typename: "ItemStateDistribution"
                    }))
                };
            });
    }

    private getStateByWeekBreakdown(data: any[]) {
        // Group by week and state
        const periodMap = new Map();
        
        data.forEach(item => {
            if (item.createdAt) {
                const date = new Date(item.createdAt);
                const startOfYear = new Date(date.getFullYear(), 0, 1);
                const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                const weekNumber = Math.ceil(days / 7);
                
                const periodKey = weekNumber.toString() + ' ' + date.getFullYear();
                const state = item.state || 'Unknown';
                
                if (!periodMap.has(periodKey)) {
                    periodMap.set(periodKey, new Map<string, number>());
                }
                
                const stateMap = periodMap.get(periodKey);
                
                if (!stateMap.has(state)) {
                    stateMap.set(state, 0);
                }
                
                stateMap.set(state, stateMap.get(state) + 1);
            }
        });
        
        // Convert map to required format
        return Array.from(periodMap.entries())
            .map(([period, stateMap]) => {
                const totalCount = Array.from(stateMap.values()).reduce((sum: number, count: number) => sum + count, 0);
                
                return {
                    period,
                    states: Array.from(stateMap.entries()).map(([state, count]) => ({
                        state,
                        count: count.toString(),
                        percentage: (((count as number) / (totalCount as number)) * 100).toFixed(1),
                        __typename: "ItemStateDistribution"
                    }))
                };
            });
    }
} 