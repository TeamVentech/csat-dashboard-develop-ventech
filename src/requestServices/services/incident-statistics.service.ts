import { Injectable } from '@nestjs/common';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';

@Injectable()
export class IncidentStatisticsService {
    constructor(private readonly elasticSearchService: ElasticService) {}
    
    async getIncidentTypeChartData(
        filters: {
            minAge?: number;
            maxAge?: number;
            gender?: string;
            fromDate?: string;
            toDate?: string;
            outcome?: string;
        }
    ) {
        try {
            // Build the query for incidents
            const query: any = {
                bool: {
                    must: [
                        { match: { 'type.keyword': 'Incident Reporting' } }
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
                                
                query.bool.must.push({
                    range: { 'metadata.customer.age': { 
                        "gte": filters.minAge,
                        "lte": filters.maxAge
                     } }
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
                const dateRange: any = { range: { 'createdAt': {} } };
                if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
                if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
                query.bool.filter.push(dateRange);
            }

            // Add outcome filter if provided
            if (filters.outcome) {
                query.bool.filter.push({
                    match: { 'metadata.Incident.outcome': filters.outcome }
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
            
            // Process incident type data for chart
            const incidentData = this.processIncidentTypeData(hits);
            
            return {
                success: true,
                data: incidentData
            };
        } catch (error) {
            console.error('Error generating incident chart data:', error);
            return {
                success: false,
                message: 'Error generating incident chart data',
                error: error.message || error
            };
        }
    }

    private processIncidentTypeData(data: any[]) {
        if (!data || data.length === 0) {
            return [];
        }

        // Extract all unique incident types and outcomes
        const incidentTypes = new Set<string>();
        const outcomes = new Set<string>();
        
        data.forEach(item => {
            if (item.metadata && item.metadata.Incident && item.metadata.Incident.type) {
                incidentTypes.add(item.metadata.Incident.type);
            }
            
            if (item.metadata && item.metadata.Incident && item.metadata.Incident.outcome) {
                outcomes.add(item.metadata.Incident.outcome);
            }
        });
        
        // Convert sets to arrays and ensure we have at least empty values if none found
        const incidentTypeArray = Array.from(incidentTypes).length > 0 
            ? Array.from(incidentTypes) 
            : ['Unknown'];
            
        const outcomeArray = Array.from(outcomes).length > 0 
            ? Array.from(outcomes) 
            : ['Unknown'];
        
        // Create a flat array of objects with type, outcome, and count
        const result = [];
        
        incidentTypeArray.forEach(type => {
            outcomeArray.forEach(outcome => {
                const count = data.filter(item => 
                    item.metadata && 
                    item.metadata.Incident &&
                    item.metadata.Incident.type === type &&
                    item.metadata.Incident.outcome === outcome
                ).length;
                
                result.push({
                    type,
                    outcome,
                    count
                });
            });
        });
        
        return result;
    }

    async getIncidentLocationChartData(
        filters: {
            minAge?: number;
            maxAge?: number;
            gender?: string;
            fromDate?: string;
            toDate?: string;
        }
    ) {
        try {
            // Build the query for incidents
            const query: any = {
                bool: {
                    must: [
                        { match: { 'type.keyword': 'Incident Reporting' } }
                    ],
                    filter: []
                }
            };

            // Add customer age range filter if provided
            if (filters.minAge !== undefined || filters.maxAge !== undefined) {
                query.bool.must.push({
                    range: { 'metadata.customer.age': { 
                        "gte": filters.minAge,
                        "lte": filters.maxAge
                     } }
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
            
            // Process location data
            const locationData = this.processLocationData(hits);
            
            return {
                success: true,
                data: locationData
            };
        } catch (error) {
            console.error('Error generating incident location chart data:', error);
            return {
                success: false,
                message: 'Error generating incident location chart data',
                error: error.message || error
            };
        }
    }

    private processLocationData(data: any[]) {
        if (!data || data.length === 0) {
            return [];
        }

        // Count occurrences of each location
        const locationCountMap = new Map<string, number>();
        
        data.forEach(item => {
            if (item.metadata && item.metadata.location) {
                const location = item.metadata.location;
                // Format as Floor - Tenant
                const locationKey = `${location.floor} - ${location.tenant}`;
                
                if (!locationCountMap.has(locationKey)) {
                    locationCountMap.set(locationKey, 0);
                }
                
                locationCountMap.set(locationKey, locationCountMap.get(locationKey) + 1);
            }
        });
        
        // Convert map to array and sort by count in descending order
        const sortedLocations = Array.from(locationCountMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([location, count]) => ({
                location,
                count
            }));
        
        return sortedLocations;
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
                        { match: { 'type.keyword': filters.type } }
                    ],
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
} 