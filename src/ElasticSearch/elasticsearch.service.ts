import { Inject, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import * as moment from 'moment';
import { Client } from '@elastic/elasticsearch';
import { classToPlain } from 'class-transformer';
import { PeriodType } from '../requestServices/dto/suggestion-chart.dto';

interface ServiceRecord {
    type?: string;
    metadata?: {
        date?: string;
    };
}
@Injectable()
export class ElasticService {
    constructor(
        private readonly elasticsearchService: ElasticsearchService
    ) { }
    async indexData(index: string, id: string, data: any) {
        // Handle empty date fields in metadata
        if (data.metadata) {
            Object.keys(data.metadata).forEach(key => {
                if (data.metadata[key] === '' && key.toLowerCase().includes('date')) {
                    data.metadata[key] = null;
                }
            });
        }
        return await this.elasticsearchService.index({
            index,
            id,
            body: data,
            refresh: true
        });
    }

    async getAllDocuments(index: string) {
        try {
            const result = await this.elasticsearchService.search({
                index,
                body: {
                    query: { match_all: {} },
                    sort: [{ createdAt: { order: 'desc' } }], // Sort by createdAt in descending order
                },
                size: 400,
            });

            const hits = result.body.hits.hits.map((hit) => hit._source);

            return {
                data: hits,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error fetching documents',
                error,
            };
        }
    }

    async getById(index: string, id: string) {
        try {
            const result = await this.elasticsearchService.search({
                index,
                body: {
                    query: {
                        term: { _id: id }, // Search for the specific document by ID
                    },
                    sort: [{ createdAt: { order: 'desc' } }], // Sort by createdAt in descending order
                },
            });

            const hits = result.body.hits.hits;

            if (hits.length > 0) {
                return {
                    success: true,
                    message: 'Document found',
                    data: hits[0]._source, // Return the first (and only) document found
                };
            } else {
                return {
                    success: false,
                    message: 'Document not found',
                };
            }
        } catch (error) {
            console.error('Error fetching document:', error);
            return {
                success: false,
                message: 'Error fetching document',
                error,
            };
        }
    }

    async getByComplaintId(index: string, id: string) {
        try {
            const result = await this.elasticsearchService.search({
                index,
                body: {
                    query: {
                        query_string: {
                            query: id
                        }
                    },
                    sort: [{ createdAt: { order: 'desc' } }], // Sort by createdAt in descending order
                },
            });

            const hits = result.body.hits.hits;

            if (hits.length > 0) {
                return {
                    success: true,
                    message: 'Document found',
                    data: hits[0]._source, // Return the first (and only) document found
                };
            } else {
                return {
                    success: false,
                    message: 'Document not found',
                };
            }
        } catch (error) {
            console.error('Error fetching document:', error);
            return {
                success: false,
                message: 'Error fetching document',
                error,
            };
        }
    }


    async updateDocument(index: string, id: string, updateData: any) {
        try {
            const transformedData = classToPlain(updateData);
            if (!transformedData || typeof transformedData !== 'object') {
                throw new Error('Invalid transformed data: Ensure it is a properly defined object');
            }

            // Handle empty date fields in metadata
            if (transformedData.metadata) {
                Object.keys(transformedData.metadata).forEach(key => {
                    if (transformedData.metadata[key] === '' && key.toLowerCase().includes('date')) {
                        transformedData.metadata[key] = null;
                    }
                });
            }

            const result = await this.elasticsearchService.update({
                index,
                id,
                body: {
                    doc: transformedData,
                },
                refresh: true
            });
            return {
                success: true,
                message: 'Document updated successfully',
                result,
            };
        } catch (error) {
            console.error('Error updating document:', error);
	        throw new Error(error.message || 'Error updating document');
            return {
                success: false,
                message: 'Error updating document',
                error: error.message || error,
            };
        }
    }

    async searchExpiringSoon(index: string) {
        try {
            const result = await this.elasticsearchService.search({
                index,
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { name: 'Gift Voucher Sales' } },        // Match name "test"
                                { match: { state: 'Sold' } }        // Match state "Open"
                            ],
                            filter: {
                                range: {
                                    'metadata.Expiry_date': {
                                        gte: 'now',
                                        lt: 'now+7d/d' // Up to 7 days from now
                                    }
                                }
                            }
                        }
                    },
                    size: 10000 // Maximum number of documents
                }
            });
            const hits = result.body.hits.hits.map((hit: any) => hit._source);
            let totalHits: number;

            if (typeof result.body.hits.total === 'number') {
                totalHits = result.body.hits.total;
            } else {
                totalHits = result.body.hits.total.value;
            }
            return {
                success: true,
                totalHits: totalHits,
                results: hits
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error searching documents',
                error
            };
        }
    }

    async searchInServiceState(index: string) {
        try {
            const result = await this.elasticsearchService.search({
                index,
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { type: 'Wheelchair & Stroller Request' } },
                                { match: { state: 'In Service' } }
                            ]
                        }
                    },
                    size: 10000 // Maximum number of documents
                }
            });
            const hits = result.body.hits.hits.map((hit: any) => hit._source);
            let totalHits: number;

            if (typeof result.body.hits.total === 'number') {
                totalHits = result.body.hits.total;
            } else {
                totalHits = result.body.hits.total.value;
            }
            return {
                success: true,
                totalHits: totalHits,
                results: hits
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error searching documents',
                error
            };
        }
    }


    async search(index: string, query: any, page: number = 1, pageSize: number = 10) {
        const from = (page - 1) * pageSize;
        const must: any[] = [];
        if (query?.name) {
            must.push({ match: { "name": query.name } });
        }
        if (query?.type) {
            must.push({ match: { "type.keyword": query.type } });
        }
        if (query?.surveyId) {
            must.push({ match: { "surveyId.keyword": query.surveyId } });
        }
        if (query?.state) {
            must.push({ match: { "state.keyword": query.state } });
        }
        if (query?.status) {
            must.push({ match: { "status.keyword": query.status } });
        }
        if (query?.customer) {
            must.push({ match: { "metadata.parents.id": query.customer } });
            // must.push({ match: { "metadata.parentss.id": query.customer } });
        }
        if (query?.complaintDate) {
            const dateStr = query.complaintDate;
            let parsedDate = moment(dateStr, ['YYYY-MM-DD', 'MM/DD/YYYY']).tz('Asia/Amman');
            if (parsedDate.isValid()) {
                const startDate = parsedDate.startOf('day').format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                const endDate = parsedDate.endOf('day').format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                must.push({
                    range: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                });
            }
        }

        if (query?.location) {
            must.push({ match: { "metadata.location.tenant.keyword": query.location } });
        }
        if (query?.department) {
            must.push({ match: { "metadata.department.name": query.department } });
        }
        if (query?.date) {
            must.push({ match: { "createdAt": query.date } });
        }

	    if (query?.from && query?.to) {
		    const range: any = { range: { createdAt: {} } };
		    if (query.from === query.to) {
			    range.range.createdAt.gte = `${query.from}T00:00:00.000Z`;
			    range.range.createdAt.lte = `${query.to}T23:59:59.999Z`;
		    } else {
			    if (query.from) range.range.createdAt.gte = query.from;
			    if (query.to) range.range.createdAt.lte = query.to;
		    }

		    must.push(range);
	    }
        if (query?.voucherId) {
            must.push({ "term": { "metadata.voucher.vouchers.serialNumber": query.voucherId } })
        }
        if(query?.search) {
            // Check if search starts with any service ID prefix
            const prefixes = ['LC-', 'FC-', 'LF-', 'CMP-', 'SUG-', 'CMT-', 'GVS-C-', 'GVS-I-', 'W-S-', 'PB-', 'HF-', 'INC-', 'SRV-'];
            
            if (prefixes.some(prefix => query.search.startsWith(prefix))) {
                // If search term looks like a service ID, use term query on serviceId field
                must.push({ 
                    term: { 
                        "serviceId.keyword": query.search 
                    } 
                });
            } else {
                // Otherwise, use the standard query_string search
                must.push({
                    query_string: {
                        query: query.search
                    }
                });
            }
        }
        console.log(JSON.stringify(query))
        const result = await this.elasticsearchService.search({
            index,
            body: {
                query: {
                    bool: {
                        must: must.length > 0 ? must : [{ match_all: {} }]
                    }
                },
                sort: [
                    {
                        createdAt: {
                            order: "desc"
                        }
                    }
                ]
            },
            from,
            size: pageSize,
        });
        let totalHits: number;

        if (typeof result.body.hits.total === 'number') {
            totalHits = result.body.hits.total;
        } else {
            totalHits = result.body.hits.total.value;
        }

        const totalPages = Math.ceil(totalHits / pageSize);
        const sources = result.body.hits.hits.map((hit) => hit._source);
        return {
            totalHits,
            totalPages,
            currentPage: page,
            pageSize,
            results: sources,
        };
    }

    async searchByQuery(index: string, query: any, page: number = 1, pageSize: number = 10) {
        const from = (page - 1) * pageSize;
        const result = await this.elasticsearchService.search({
            index,
            body: {
                ...query
            },
            from,
            size: pageSize,
        });
        let totalHits: number;

        if (typeof result.body.hits.total === 'number') {
            totalHits = result.body.hits.total;
        } else {
            totalHits = result.body.hits.total.value;
        }

        const totalPages = Math.ceil(totalHits / pageSize);
        const sources = result.body.hits.hits.map((hit) => hit._source);
        return {
            totalHits,
            totalPages,
            currentPage: page,
            pageSize,
            results: sources,
        };
    }
    async searchExtendedVoucher(index: string, page: number = 1, pageSize: number = 300) {
        const from = (page - 1) * pageSize;

        const must: any[] = [];
        must.push({ "match": { "metadata.voucher.vouchers.metadata.status": 'Extended' } })

        const result = await this.elasticsearchService.search({
            index,
            body: {
                query: {
                    bool: {
                        must: must.length > 0 ? must : [{ match_all: {} }]
                    },
                },
                sort: [
                    {
                        createdAt: {
                            order: "desc"
                        }
                    }
                ]
            },
            from,
            size: pageSize,
        });
        let totalHits: number;

        if (typeof result.body.hits.total === 'number') {
            totalHits = result.body.hits.total;
        } else {
            totalHits = result.body.hits.total.value;
        }

        const totalPages = Math.ceil(totalHits / pageSize);
        const sources = result.body.hits.hits.map((hit) => hit._source);
        return {
            totalHits,
            totalPages,
            currentPage: page,
            pageSize,
            results: sources,
        };
    }


    async getCustomerSurvey(index: string, id: string, page: number = 1, pageSize: number = 10) {
        const from = (page - 1) * pageSize;
        const result = await this.elasticsearchService.search({
            index,
            body: {
                query: {
                    query_string: {
                        query: id
                    }
                },
                sort: [
                    {
                        createdAt: {
                            order: "desc"
                        }
                    }
                ]
            },
            from,
            size: pageSize,
        });
        let totalHits: number;

        if (typeof result.body.hits.total === 'number') {
            totalHits = result.body.hits.total;
        } else {
            totalHits = result.body.hits.total.value;
        }

        const totalPages = Math.ceil(totalHits / pageSize);
        const sources = result.body.hits.hits.map((hit) => hit._source);
        return {
            totalHits,
            totalPages,
            currentPage: page,
            pageSize,
            results: sources,
        };
    }
    async customer_search(index: string, query: any, page: number = 1, pageSize: number = 10) {
        const from = (page - 1) * pageSize;
        const result = await this.elasticsearchService.search({
            index,
            body: {
                query: {
                    query_string: {
                        query: query.customer
                    }
                },
                sort: [
                    {
                        createdAt: {
                            order: "desc"
                        }
                    }
                ]
            },
            from,
            size: pageSize,
        });
        let totalHits: number;

        if (typeof result.body.hits.total === 'number') {
            totalHits = result.body.hits.total;
        } else {
            totalHits = result.body.hits.total.value;
        }

        const totalPages = Math.ceil(totalHits / pageSize);
        const sources = result.body.hits.hits.map((hit) => hit._source);
        return {
            totalHits,
            totalPages,
            currentPage: page,
            pageSize,
            results: sources,
        };
    }
    async deleteDocument(index: string, id: string) {
        try {
            const result = await this.elasticsearchService.delete({
                index,
                id,
                refresh: true
            });

            return {
                result
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error deleting document',
                error,
            };
        }
    }

    async searchComplaintTask(index: string, query: any, page: number = 1, pageSize: number = 10) {
        const from = (page - 1) * pageSize;

        // const must: any[] = [];
        const must_status: any[] = [];
        // if (query?.name) {
        //     must.push({ match: { "name": query.name } });
        // }
        if (query) {
            must_status.push({ match: { "status": query } });
        }
        const result = await this.elasticsearchService.search({
            index,
            body: {
                query: {
                    bool: {
                        must_not: must_status.length > 0 ? must_status : [{ match_all: {} }]
                    },
                },
                sort: [
                    {
                        createdAt: {
                            order: "desc"
                        }
                    }
                ]
            },
            from,
            size: pageSize,
        });
        let totalHits: number;

        if (typeof result.body.hits.total === 'number') {
            totalHits = result.body.hits.total;
        } else {
            totalHits = result.body.hits.total.value;
        }

        const totalPages = Math.ceil(totalHits / pageSize);
        const sources = result.body.hits.hits.map((hit) => hit._source);
        return {
            totalHits,
            totalPages,
            currentPage: page,
            pageSize,
            results: sources,
        };
    }

    async searchTask(index: string, query: any, page: number = 1, pageSize: number = 10) {
        const from = (page - 1) * pageSize;

        const must: any[] = [];
        if (query?.role) {
            must.push({ match: { "assignedTo": query.role } });
        }
        if (query?.type) {
            must.push({ match: { "name.keyword": query.type } });
        }
        if (query?.status) {
            must.push({ match: { "status.keyword": query.status } });
        }
        if(query?.search) {
            const prefixes = ['#LC-', '#FC-', '#LF-', '#CMP-', '#SUG-', '#CMT-', '#GVS-C-', '#GVS-I-', '#W-S-', '#PB-', '#HF-', '#INC-', '#SRV-', '#CO-'];
            
            if (prefixes.some(prefix => query.search.startsWith(prefix))) {
                must.push({ 
                    term: { 
                        "complaintId.keyword": query.search 
                    } 
                });
            } else {
                // Otherwise, use the standard query_string search
                must.push({
                    query_string: {
                        query: query.search
                    }
                });
            }

        }

        if (query?.tasksDate) {
            const dateStr = query.tasksDate;
            let parsedDate = moment(dateStr, ['YYYY-MM-DD', 'MM/DD/YYYY']).tz('Asia/Amman');
            if (parsedDate.isValid()) {
                const startDate = parsedDate.startOf('day').format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                const endDate = parsedDate.endOf('day').format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                must.push({
                    range: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                });
            }
        }
        console.log(JSON.stringify(query))
        const result = await this.elasticsearchService.search({
            index,
            body: {
                query: {
                    bool: {
                        must: must.length > 0 ? must : [{ match_all: {} }],
                        must_not: [
                            { match: { "status": "Closed" } } // Exclude closed tasks
                        ]
                    },
                },
                sort: [
                    {
                        createdAt: {
                            order: "desc"
                        }
                    }
                ]
            },
            from,
            size: pageSize,
        });
        let totalHits: number;

        if (typeof result.body.hits.total === 'number') {
            totalHits = result.body.hits.total;
        } else {
            totalHits = result.body.hits.total.value;
        }

        const totalPages = Math.ceil(totalHits / pageSize);
        const sources = result.body.hits.hits.map((hit) => hit._source);
        return {
            totalHits,
            totalPages,
            currentPage: page,
            pageSize,
            results: sources,
        };
    }

    async getRecordsCount() {
        const response = await this.elasticsearchService.search({
            index: 'services',
            size: 1000, // Adjust based on your data size
        });

        const hits = response.body.hits.hits.map((hit) => hit._source as ServiceRecord);

        const today = moment().format('YYYY-MM-DD'); // Get today's date

        const counts: Record<string, { total: number; new: number; active: number }> = {};

        const excludedStates = new Set([
            'Closed',
            'Article Found',
            'Article Not Found',
            'Item Returned',
            'Item Not Returned',
            'Bags Returned'
        ]);

        for (const record of hits) {
          if (!record) continue; // Ensure record exists

          const type = record.type || 'Unknown';
          const recordDate = record.metadata?.date ? moment(record.metadata.date).format('YYYY-MM-DD') : '';

          // Initialize if not present
          if (!counts[type]) {
            counts[type] = { total: 0, new: 0, active: 0 };
          }

          // Count total records by type
          counts[type].total++;

          // Count new records (created today)
          if (recordDate === today) {
            counts[type].new++;
          }

          // Count active cases (state is NOT in the excluded list)
          if (!excludedStates.has(record.state)) {
            counts[type].active++;
          }

        }

        return counts;
    }

    async searchTaskCount(index: string, query: any) {
        const must: any[] = [];

        if (query?.role) {
            must.push({ match: { "assignedTo": query.role } });
        }

        const result = await this.elasticsearchService.search({
            index,
            body: {
                size: 0, // Don't return actual documents
                track_total_hits: true, // Ensure total count is accurate
                query: {
                    bool: {
                        must: must.length > 0 ? must : [{ match_all: {} }],
                        must_not: [
                            { match: { "status": "Closed" } } // Exclude closed tasks
                        ]
                    }
                },
                aggs: {
                    name_count: {
                        terms: {
                            field: "name.keyword", // Ensure 'name' is a keyword field
                            size: 10000 // Adjust based on expected unique names
                        }
                    }
                }
            }
        });

        // Extract aggregated counts
        const nameCounts =
            (result.body.aggregations?.name_count as { buckets: { key: string; doc_count: number }[] })
                ?.buckets?.map(bucket => ({
                    name: bucket.key,
                    count: bucket.doc_count
                })) || [];

        // Get the total count from search result metadata
        const totalCount = result.body.hits.total
            ? (typeof result.body.hits.total === "number" ? result.body.hits.total : result.body.hits.total.value)
            : 0;

        return {
            totalCount,
            nameCounts
        };
    }

    /**
     * Access the underlying Elasticsearch connection for advanced operations
     * @returns The ElasticsearchService instance
     */
    getSearchService(): ElasticsearchService {
        return this.elasticsearchService;
    }

    async getLostChildChartData(
        filters: {
            minAge?: number;
            maxAge?: number;
            gender?: string;
            fromDate?: string;
            toDate?: string;
            locationId?: string;
            period?: string;
        }
    ) {
        try {
            // Build the query
            const query: any = {
                bool: {
                    must: [
                        { match: { 'type.keyword': 'Lost Child' } }
                    ],
                    filter: []
                }
            };

            // Add age range filter if provided
            if (filters.minAge !== undefined || filters.maxAge !== undefined) {
                const ageRange: any = { range: { 'metadata.child.age': {} } };
                if (filters.minAge !== undefined) ageRange.range['metadata.child.age'].gte = filters.minAge;
                if (filters.maxAge !== undefined) ageRange.range['metadata.child.age'].lte = filters.maxAge;
                query.bool.filter.push(ageRange);
            }

            // Add gender filter if provided
            if (filters.gender) {
                query.bool.filter.push({
                    match: { 'metadata.child.gender': filters.gender }
                });
            }

            // Add date range filter if provided
            if (filters.fromDate || filters.toDate) {
                const dateRange: any = { range: { 'createdAt': {} } };
                if (filters.fromDate) dateRange.range['createdAt'].gte = filters.fromDate;
                if (filters.toDate) dateRange.range['createdAt'].lte = filters.toDate;
                query.bool.filter.push(dateRange);
            }

            // Add location filter if provided
            if (filters.locationId) {
                query.bool.filter.push({
                    match: { 'metadata.location.id': filters.locationId }
                });
            }

            // Execute search query
            const result = await this.elasticsearchService.search({
                index: 'services',
                body: {
                    query,
                    size: 10000 // Get all matching documents
                }
            });

            const hits = result.body.hits.hits.map((hit: any) => hit._source);

            // Process data for chart based on the period type
            const chartData = this.processLostChildChartData(hits, filters.period);

            return {
                success: true,
                data: {
                    reportLostChildPeriod: chartData
                }
            };
        } catch (error) {
            console.error('Error generating lost child chart data:', error);
            return {
                success: false,
                message: 'Error generating lost child chart data',
                error: error.message || error
            };
        }
    }

    private processLostChildChartData(data: any[], periodType: string | undefined) {
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
            __typename: "ReportPeriodLostChild"
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
            __typename: "ReportPeriodLostChild"
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
            __typename: "ReportPeriodLostChild"
        }));
    }

    async getLostChildLocationChartData(
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
                        { match: { type: 'Lost Child' } }
                    ],
                    filter: []
                }
            };

            // Add age range filter if provided
            if (filters.minAge !== undefined || filters.maxAge !== undefined) {
                const ageRange: any = { range: { 'metadata.child.age': {} } };
                if (filters.minAge !== undefined) ageRange.range['metadata.child.age'].gte = filters.minAge;
                if (filters.maxAge !== undefined) ageRange.range['metadata.child.age'].lte = filters.maxAge;
                query.bool.filter.push(ageRange);
            }

            // Add gender filter if provided
            if (filters.gender) {
                query.bool.filter.push({
                    match: { 'metadata.child.gender': filters.gender }
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
            const result = await this.elasticsearchService.search({
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
            console.error('Error generating lost child location chart data:', error);
            return {
                success: false,
                message: 'Error generating lost child location chart data',
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

            if (locationType === 'found' && item.metadata.Foundlocations) {
                // Use found location
                location = item.metadata.Foundlocations;
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
                __typename: "LocationDistribution"
            }));

        return sortedLocations;
    }

    async getLostChildDurationData(
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
            // Build the query - we only want Lost Child cases that have been found (closed)
            const query: any = {
                bool: {
                    must: [
                        { match: { type: 'Lost Child' } },
                        { match: { state: 'Closed' } },
                        { exists: { field: 'metadata.dateFound' } }
                    ],
                    filter: []
                }
            };

            // Add age range filter if provided
            if (filters.minAge !== undefined || filters.maxAge !== undefined) {
                const ageRange: any = { range: { 'metadata.child.age': {} } };
                if (filters.minAge !== undefined) ageRange.range['metadata.child.age'].gte = filters.minAge;
                if (filters.maxAge !== undefined) ageRange.range['metadata.child.age'].lte = filters.maxAge;
                query.bool.filter.push(ageRange);
            }

            // Add gender filter if provided
            if (filters.gender) {
                query.bool.filter.push({
                    match: { 'metadata.child.gender': filters.gender }
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
            const result = await this.elasticsearchService.search({
                index: 'services',
                body: {
                    query,
                    size: 10000,
                    sort: [{ 'createdAt': { order: 'desc' } }]
                }
            });

            const hits = result.body.hits.hits.map((hit: any) => hit._source);

            // Calculate duration statistics
            const durationData = this.processDurationData(hits, filters.period);

            return {
                success: true,
                data: {
                    durationStatistics: durationData
                }
            };
        } catch (error) {
            console.error('Error generating lost child duration data:', error);
            return {
                success: false,
                message: 'Error generating lost child duration data',
                error: error.message || error
            };
        }
    }

    private processDurationData(data: any[], periodType: string = 'Monthly') {
        if (!data || data.length === 0) {
            return {
                averageDuration: "0",
                breakdown: []
            };
        }

        // Calculate duration for each record
        const recordsWithDuration = data.map(item => {
            const createdDate = new Date(item.createdAt);
            const foundDate = new Date(item.metadata?.dateFound);

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
                breakdown = this.getTimeOfDayDurationBreakdown(recordsWithDuration);
                break;
            case 'Monthly':
                breakdown = this.getMonthlyDurationBreakdown(recordsWithDuration);
                break;
            case 'Weekly':
                breakdown = this.getWeeklyDurationBreakdown(recordsWithDuration);
                break;
            default:
                breakdown = this.getMonthlyDurationBreakdown(recordsWithDuration);
        }

        return {
            averageDuration,
            breakdown
        };
    }

    private getTimeOfDayDurationBreakdown(data: any[]) {
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
                __typename: "DurationBreakdown"
            }));
    }

    private getMonthlyDurationBreakdown(data: any[]) {
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
                __typename: "DurationBreakdown"
            }));
    }

    private getWeeklyDurationBreakdown(data: any[]) {
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
                __typename: "DurationBreakdown"
            }));
    }

    async getSuggestionChartData(
        filters: {
            fromDate?: string;
            toDate?: string;
            period?: PeriodType;
            categoryId?: string;
            touchpointId?: string;
            departmentId?: string;
            minAge?: number;
            maxAge?: number;
            gender?: string;
        }
    ) {
        try {
            // Build the query
            const query: any = {
                bool: {
                    must: [
                        { match: { name: 'Suggestion Box' } }
                    ],
                    filter: []
                }
            };

            // Add date range filter if provided
            if (filters.fromDate || filters.toDate) {
                const dateRange: any = { range: { createdAt: {} } };
                if (filters.fromDate) dateRange.range.createdAt.gte = filters.fromDate;
                if (filters.toDate) dateRange.range.createdAt.lte = filters.toDate;
                query.bool.filter.push(dateRange);
            }

            // Add category filter if provided
            if (filters.categoryId) {
                query.bool.filter.push({
                    match: { 'metadata.category.id': filters.categoryId }
                });
            }

            // Add touchpoint filter if provided
            if (filters.touchpointId) {
                query.bool.filter.push({
                    match: { 'metadata.touchpoint.id': filters.touchpointId }
                });
            }

            // Add department filter if provided
            if (filters.departmentId) {
                query.bool.filter.push({
                    match: { 'metadata.department.id': filters.departmentId }
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

            // Execute search query
            const result = await this.elasticsearchService.search({
                index: 'services',
                body: {
                    query,
                    size: 10000 // Get all matching documents
                }
            });

            const hits = result.body.hits.hits.map((hit: any) => hit._source);

            // Create date filter object for chart processing
            const dateFilters = {
                fromDate: filters.fromDate,
                toDate: filters.toDate
            };

            // Process data for chart based on the period type
            const chartData = this.processSuggestionChartData(hits, filters.period, dateFilters);

            // Process data for table details
            const tableData = this.processSuggestionTableData(hits);

            return {
                success: true,
                data: {
                    chartData,
                    tableData
                }
            };
        } catch (error) {
            console.error('Error generating suggestion chart data:', error);
            return {
                success: false,
                message: 'Error generating suggestion chart data',
                error: error.message || error
            };
        }
    }

    private processSuggestionChartData(data: any[], periodType: PeriodType = PeriodType.MONTHLY, filters?: { fromDate?: string; toDate?: string }) {
        if (!data || data.length === 0) {
            return [];
        }

        switch (periodType) {
            case PeriodType.DAILY:
                return this.processDailySuggestionData(data, filters);
            case PeriodType.WEEKLY:
                return this.processWeeklySuggestionData(data, filters);
            case PeriodType.MONTHLY:
            default:
                return this.processMonthlySuggestionData(data, filters);
        }
    }

    private processDailySuggestionData(data: any[], filters?: { fromDate?: string; toDate?: string }) {
        // Use fromDate and toDate from filters if available, otherwise find date range from data
        let minDate: Date | null = filters?.fromDate ? new Date(filters.fromDate) : null;
        let maxDate: Date | null = filters?.toDate ? new Date(filters.toDate) : null;

        // If filters are not provided, determine range from data
        if (!minDate || !maxDate) {
            data.forEach(item => {
                if (item.createdAt) {
                    const date = new Date(item.createdAt);
                    if (!minDate || date < minDate) minDate = new Date(date);
                    if (!maxDate || date > maxDate) maxDate = new Date(date);
                }
            });
        }

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
            const dayKey = currentDate.toISOString().split('T')[0];
            dayMap.set(dayKey, {
                total: 0,
                categories: {}
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Count suggestions for each day and category
        data.forEach(item => {
            if (item.createdAt) {
                const date = new Date(item.createdAt);
                const dayKey = date.toISOString().split('T')[0];

                if (dayMap.has(dayKey)) {
                    const dayData = dayMap.get(dayKey);
                    dayData.total += 1;

                    // Get category name
                    const categoryName = item.metadata?.category?.name?.en || 'Uncategorized';
                    if (!dayData.categories[categoryName]) {
                        dayData.categories[categoryName] = 0;
                    }
                    dayData.categories[categoryName] += 1;
                }
            }
        });

        // Convert map to array in the required format
        return Array.from(dayMap.entries()).map(([period, data]) => {
            const categories = Object.entries(data.categories).map(([category, count]) => ({
                category,
                count
            }));

            return {
                period: period,
                total: data.total,
                categories
            };
        });
    }

    private processWeeklySuggestionData(data: any[], filters?: { fromDate?: string; toDate?: string }) {
        // Use fromDate and toDate from filters if available, otherwise find date range from data
        let minDate: Date | null = filters?.fromDate ? new Date(filters.fromDate) : null;
        let maxDate: Date | null = filters?.toDate ? new Date(filters.toDate) : null;

        // If filters are not provided, determine range from data
        if (!minDate || !maxDate) {
            data.forEach(item => {
                if (item.createdAt) {
                    const date = new Date(item.createdAt);
                    if (!minDate || date < minDate) minDate = new Date(date);
                    if (!maxDate || date > maxDate) maxDate = new Date(date);
                }
            });
        }

        // If no data or invalid dates, return empty array
        if (!minDate || !maxDate) {
            return [];
        }

        // Get start of the week for minDate
        const startDay = minDate.getDay();
        minDate.setDate(minDate.getDate() - startDay);
        minDate.setHours(0, 0, 0, 0);

        // Create map of all weeks in the range
        const weekMap = new Map();
        const weekRanges = []; // Store actual date ranges for matching
        const currentDate = new Date(minDate);

        while (currentDate <= maxDate) {
            const weekStart = new Date(currentDate);
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 6);

            // Format dates without year for display
            const formatDateWithoutYear = (date) => {
                const month = date.toLocaleString('default', { month: 'short' });
                const day = date.getDate();
                return `${month} ${day}`;
            };

            const weekKey = `${formatDateWithoutYear(weekStart)} to ${formatDateWithoutYear(weekEnd)}`;

            weekMap.set(weekKey, {
                total: 0,
                categories: {}
            });

            // Store the actual date range for this week
            weekRanges.push({
                key: weekKey,
                start: new Date(weekStart),
                end: new Date(weekEnd)
            });

            currentDate.setDate(currentDate.getDate() + 7);
        }

        // Count suggestions for each week and category
        data.forEach(item => {
            if (item.createdAt) {
                const date = new Date(item.createdAt);

                // Find the corresponding week
                for (const range of weekRanges) {
                    const weekKey = range.key;
                    const weekStart = range.start;
                    const weekEnd = range.end;

                    weekEnd.setHours(23, 59, 59, 999);

                    if (date >= weekStart && date <= weekEnd) {
                        const weekData = weekMap.get(weekKey);
                        weekData.total += 1;

                        // Get category name
                        const categoryName = item.metadata?.category?.name?.en || 'Uncategorized';
                        if (!weekData.categories[categoryName]) {
                            weekData.categories[categoryName] = 0;
                        }
                        weekData.categories[categoryName] += 1;

                        break;
                    }
                }
            }
        });

        // Convert map to array in the required format
        return Array.from(weekMap.entries()).map(([period, data]) => {
            const categories = Object.entries(data.categories).map(([category, count]) => ({
                category,
                count
            }));

            return {
                period: period,
                total: data.total,
                categories
            };
        });
    }

    private processMonthlySuggestionData(data: any[], filters?: { fromDate?: string; toDate?: string }) {
        // Use fromDate and toDate from filters if available, otherwise find date range from data
        let minDate: Date | null = filters?.fromDate ? new Date(filters.fromDate) : null;
        let maxDate: Date | null = filters?.toDate ? new Date(filters.toDate) : null;

        // If filters are not provided, determine range from data
        if (!minDate || !maxDate) {
            data.forEach(item => {
                if (item.createdAt) {
                    const date = new Date(item.createdAt);
                    if (!minDate || date < minDate) minDate = new Date(date);
                    if (!maxDate || date > maxDate) maxDate = new Date(date);
                }
            });
        }

        // If no data or invalid dates, return empty array
        if (!minDate || !maxDate) {
            return [];
        }

        // Create map of all months in the range
        const monthMap = new Map();
        const currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

        while (currentDate <= endDate) {
            const monthKey = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
            monthMap.set(monthKey, {
                total: 0,
                categories: {}
            });

            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // Count suggestions for each month and category
        data.forEach(item => {
            if (item.createdAt) {
                const date = new Date(item.createdAt);
                const monthKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;

                if (monthMap.has(monthKey)) {
                    const monthData = monthMap.get(monthKey);
                    monthData.total += 1;

                    // Get category name
                    const categoryName = item.metadata?.category?.name?.en || 'Uncategorized';
                    if (!monthData.categories[categoryName]) {
                        monthData.categories[categoryName] = 0;
                    }
                    monthData.categories[categoryName] += 1;
                }
            }
        });

        // Convert map to array in the required format
        return Array.from(monthMap.entries()).map(([period, data]) => {
            const categories = Object.entries(data.categories).map(([category, count]) => ({
                category,
                count
            }));

            return {
                period: period,
                total: data.total,
                categories
            };
        });
    }

    private processSuggestionTableData(data: any[]) {
        if (!data || data.length === 0) {
            return [];
        }

        // Create a map to aggregate data by category, touchpoint, and department
        const aggregatedData = new Map();

        data.forEach(item => {
            const categoryName = item.metadata?.category?.name?.en || 'Uncategorized';
            const touchpointName = item.metadata?.touchpoint?.name?.en || 'Uncategorized';
            const departmentName = item.metadata?.department?.name || 'Uncategorized';
            const dateStr = new Date(item.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD

            const key = `${categoryName}|${touchpointName}|${departmentName}`;

            if (!aggregatedData.has(key)) {
                aggregatedData.set(key, {
                    category: categoryName,
                    touchpoint: touchpointName,
                    department: departmentName,
                    total: 0,
                    dates: {}
                });
            }

            const entry = aggregatedData.get(key);
            entry.total += 1;

            if (!entry.dates[dateStr]) {
                entry.dates[dateStr] = 0;
            }

            entry.dates[dateStr] += 1;
        });

        // Convert map to array in the required format
        return Array.from(aggregatedData.values()).map(entry => ({
            category: entry.category,
            touchpoint: entry.touchpoint,
            department: entry.department,
            total: entry.total,
            dateBreakdown: Object.entries(entry.dates).map(([date, count]) => ({
                date,
                count
            }))
        }));
    }
}
