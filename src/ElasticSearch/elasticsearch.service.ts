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

    async getById(index: string, id: string) {
        try {
            const result = await this.elasticsearchService.get({
                index,
                id,
            });
            if (result.found) {
                return {
                    success: true,
                    message: 'Document found',
                    data: result._source, // Document source data
                };
            }
        } catch (error) {
            console.log(error)
        }
    }

    async updateDocument(index: string, id: string, updateData: any) {
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


    async search(index: string, query: any, page: number = 1, pageSize: number = 10) {
        const from = (page - 1) * pageSize;

        const must: any[] = [];
        if (query?.name) {
            must.push({ match: { "name.keyword": query.name } });
        }
        if (query?.type) {
            must.push({ match: { "type.keyword": query.type } });
        }
        if (query?.state) {
            must.push({ match: { "state": query.state } });
        }
        if (query?.location) {
            must.push({ match: { "metadata.location.tenant": query.location } });
        }
        if (query?.department) {
            must.push({ match: { "metadata.department.name": query.department } });
        }
        if (query?.date) {
            must.push({ match: { "createdAt": query.date } });
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

}
