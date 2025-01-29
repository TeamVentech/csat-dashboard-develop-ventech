"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticService = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_1 = require("@nestjs/elasticsearch");
let ElasticService = class ElasticService {
    constructor(elasticsearchService) {
        this.elasticsearchService = elasticsearchService;
    }
    async indexData(index, id, data) {
        return await this.elasticsearchService.index({
            index,
            id,
            body: data,
        });
    }
    async getAllDocuments(index) {
        try {
            const result = await this.elasticsearchService.search({
                index,
                body: {
                    query: { match_all: {} },
                    sort: [{ createdAt: { order: 'desc' } }],
                },
                size: 400,
            });
            const hits = result.hits.hits.map((hit) => hit._source);
            return {
                data: hits,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error fetching documents',
                error,
            };
        }
    }
    async getById(index, id) {
        try {
            const result = await this.elasticsearchService.search({
                index,
                body: {
                    query: {
                        term: { _id: id },
                    },
                    sort: [{ createdAt: { order: 'desc' } }],
                },
            });
            const hits = result.hits.hits;
            if (hits.length > 0) {
                return {
                    success: true,
                    message: 'Document found',
                    data: hits[0]._source,
                };
            }
            else {
                return {
                    success: false,
                    message: 'Document not found',
                };
            }
        }
        catch (error) {
            console.error('Error fetching document:', error);
            return {
                success: false,
                message: 'Error fetching document',
                error,
            };
        }
    }
    async updateDocument(index, id, updateData) {
        console.log(index);
        console.log(id);
        console.log(updateData);
        try {
            const result = await this.elasticsearchService.update({
                index,
                id,
                body: {
                    doc: updateData,
                },
            });
            console.log(result);
        }
        catch (error) {
            console.log(error);
            return {
                success: false,
                message: 'Error updating document',
                error,
            };
        }
    }
    async searchExpiringSoon(index) {
        try {
            const result = await this.elasticsearchService.search({
                index,
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { name: 'Gift Voucher Sales' } },
                                { match: { state: 'Sold' } }
                            ],
                            filter: {
                                range: {
                                    'metadata.Expiry_date': {
                                        gte: 'now',
                                        lt: 'now+7d/d'
                                    }
                                }
                            }
                        }
                    },
                    size: 10000
                }
            });
            const hits = result.hits.hits.map((hit) => hit._source);
            let totalHits;
            if (typeof result.hits.total === 'number') {
                totalHits = result.hits.total;
            }
            else {
                totalHits = result.hits.total.value;
            }
            return {
                success: true,
                totalHits: totalHits,
                results: hits
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error searching documents',
                error
            };
        }
    }
    async searchInServiceState(index) {
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
                    size: 10000
                }
            });
            const hits = result.hits.hits.map((hit) => hit._source);
            let totalHits;
            if (typeof result.hits.total === 'number') {
                totalHits = result.hits.total;
            }
            else {
                totalHits = result.hits.total.value;
            }
            return {
                success: true,
                totalHits: totalHits,
                results: hits
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error searching documents',
                error
            };
        }
    }
    async search(index, query, page = 1, pageSize = 10) {
        const from = (page - 1) * pageSize;
        const must = [];
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
        let totalHits;
        if (typeof result.hits.total === 'number') {
            totalHits = result.hits.total;
        }
        else {
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
    async deleteDocument(index, id) {
        try {
            const result = await this.elasticsearchService.delete({
                index,
                id,
            });
            return {
                result
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error deleting document',
                error,
            };
        }
    }
};
exports.ElasticService = ElasticService;
exports.ElasticService = ElasticService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [elasticsearch_1.ElasticsearchService])
], ElasticService);
//# sourceMappingURL=elasticsearch.service.js.map