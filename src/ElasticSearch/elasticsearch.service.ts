import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class ElasticService {
    constructor(private readonly elasticsearchService: ElasticsearchService) { }

    async indexData(index: string, id: string, data: any) {
        return await this.elasticsearchService.index({
            index,
            id,
            body: data,
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

            const hits = result.hits.hits.map((hit) => hit._source);

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

            const hits = result.hits.hits;

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
        console.log(index)
        console.log(id)
        console.log(updateData)
        try {
            const result = await this.elasticsearchService.update({
                index,
                id,
                body: {
                    doc: updateData,
                },
            });
            console.log(result)
        } catch (error) {
            console.log(error)
            return {
                success: false,
                message: 'Error updating document',
                error,
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
            const hits = result.hits.hits.map((hit: any) => hit._source);
            let totalHits: number;

            if (typeof result.hits.total === 'number') {
                totalHits = result.hits.total;
            } else {
                totalHits = result.hits.total.value;
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
            const hits = result.hits.hits.map((hit: any) => hit._source);
            let totalHits: number;

            if (typeof result.hits.total === 'number') {
                totalHits = result.hits.total;
            } else {
                totalHits = result.hits.total.value;
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

        console.log(query)
        const must: any[] = [];
        if (query?.name) {
            must.push({ match: { "name": query.name } });
        }
        if (query?.type) {
            must.push({ match: { "type.keyword": query.type } });
        }
        if (query?.state) {
            must.push({ match: { "state": query.state } });
        }
        if (query?.customer) {
            must.push({ match: { "metadata.customer.id": query.customer } });
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
        if (query.voucherId) {
            must.push({ "term": { "metadata.voucher.vouchers.VoucherId.keyword": query.voucherId} })
        }
        console.log(must)
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

        if (typeof result.hits.total === 'number') {
            totalHits = result.hits.total;
        } else {
            totalHits = result.hits.total.value;
        }

        const totalPages = Math.ceil(totalHits / pageSize);
        const sources = result.hits.hits.map((hit) => hit._source);
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

}
