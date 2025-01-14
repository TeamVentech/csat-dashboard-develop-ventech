import { ElasticsearchService } from '@nestjs/elasticsearch';
export declare class ElasticService {
    private readonly elasticsearchService;
    constructor(elasticsearchService: ElasticsearchService);
    indexData(index: string, id: string, data: any): Promise<import("@elastic/elasticsearch/lib/api/types").WriteResponseBase>;
    getById(index: string, id: string): Promise<{
        success: boolean;
        message: string;
        data: unknown;
    }>;
    updateDocument(index: string, id: string, updateData: any): Promise<{
        success: boolean;
        message: string;
        error: any;
    }>;
    searchExpiringSoon(index: string): Promise<{
        success: boolean;
        totalHits: number;
        results: any[];
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        totalHits?: undefined;
        results?: undefined;
    }>;
    search(index: string, query: any, page?: number, pageSize?: number): Promise<{
        totalHits: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
        results: unknown[];
    }>;
}
