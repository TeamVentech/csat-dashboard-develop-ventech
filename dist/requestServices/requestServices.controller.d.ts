import { RequestServicesService } from './requestServices.service';
import { UpdateRequestServicesDto } from './dto/update.dto';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
export declare class RequestServicesController {
    private readonly requestServicesService;
    private readonly elasticSearchService;
    constructor(requestServicesService: RequestServicesService, elasticSearchService: ElasticService);
    create(createRequestServicesDto: any): Promise<import("./entities/requestServices.entity").RequestServices>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        data: import("./entities/requestServices.entity").RequestServices[];
        total: number;
    }>;
    findOne(id: string): Promise<unknown>;
    findType(type: string): Promise<import("./entities/requestServices.entity").RequestServices[]>;
    update(id: string, updateRequestServicesDto: UpdateRequestServicesDto): Promise<unknown>;
    rating(id: string, rate: any): Promise<unknown>;
    remove(id: string): Promise<void>;
    elasticSerchQurey(page: number, perPage: number, search?: any): Promise<{
        totalHits: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
        results: unknown[];
    }>;
}
