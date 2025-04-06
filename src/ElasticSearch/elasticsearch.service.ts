import { Inject, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import * as moment from 'moment';
import { Client } from '@elastic/elasticsearch';
import { classToPlain } from 'class-transformer';
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
        if (query?.state) {
            must.push({ match: { "state.keyword": query.state } });
        }
        if (query?.status) {
            must.push({ match: { "status.keyword": query.status } });
        }
        if (query?.customer) {
            must.push({ match: { "metadata.parents.id": query.customer } });
            // must.push({ match: { "metadata.parents.id": query.customer } });
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
        if (query?.voucherId) {
            must.push({ "term": { "metadata.voucher.vouchers.serialNumber": query.voucherId } })
        }
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

    async getRecordsCount() {
        const response = await this.elasticsearchService.search({
            index: 'services',
            size: 1000, // Adjust based on your data size
        });

        const hits = response.body.hits.hits.map((hit) => hit._source as ServiceRecord);

        const today = moment().format('YYYY-MM-DD'); // Get today's date

        const counts: Record<string, { total: number; new: number }> = {};

        for (const record of hits) {
            if (!record) continue; // Ensure record exists

            const type = record.type || 'Unknown';
            const recordDate = record.metadata?.date ? moment(record.metadata.date).format('YYYY-MM-DD') : '';

            // Initialize if not present
            if (!counts[type]) {
                counts[type] = { total: 0, new: 0 };
            }

            // Count total records by type
            counts[type].total++;

            // Count new records (created today)
            if (recordDate === today) {
                counts[type].new++;
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

}
