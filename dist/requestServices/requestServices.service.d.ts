import { Repository } from 'typeorm';
import { RequestServices } from './entities/requestServices.entity';
import { CreateRequestServicesDto } from './dto/create.dto';
import { UpdateRequestServicesDto } from './dto/update.dto';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
import { VouchersService } from 'vochers/vouchers.service';
import { ServicesService } from 'service/services.service';
import { CustomersService } from 'customers/customers.service';
export declare class RequestServicesService {
    private readonly requestServicesRepository;
    private readonly elasticService;
    private readonly vouchersService;
    private readonly servicesService;
    private readonly customerService;
    constructor(requestServicesRepository: Repository<RequestServices>, elasticService: ElasticService, vouchersService: VouchersService, servicesService: ServicesService, customerService: CustomersService);
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
    sendSms(data: any, message: any, number: string): Promise<void>;
}
