import { Repository } from 'typeorm';
import { RequestServices } from './entities/requestServices.entity';
import { CreateRequestServicesDto } from './dto/create.dto';
import { UpdateRequestServicesDto } from './dto/update.dto';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
export declare class RequestServicesService {
    private readonly requestServicesRepository;
    private readonly elasticService;
    constructor(requestServicesRepository: Repository<RequestServices>, elasticService: ElasticService);
    create(createRequestServicesDto: CreateRequestServicesDto): Promise<RequestServices>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        data: RequestServices[];
        total: number;
    }>;
    findOne(id: string): Promise<unknown>;
    findOneColumn(id: string): Promise<RequestServices>;
    findType(type: string): Promise<RequestServices[]>;
    update(id: string, updateRequestServicesDto: UpdateRequestServicesDto): Promise<unknown>;
    rating(id: string, rate: any): Promise<unknown>;
    remove(id: string): Promise<void>;
    sendSms(data: any, message: string, number: string): Promise<void>;
}
