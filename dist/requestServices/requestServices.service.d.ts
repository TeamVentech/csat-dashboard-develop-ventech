import { Repository } from 'typeorm';
import { RequestServices } from './entities/requestServices.entity';
import { CreateRequestServicesDto } from './dto/create.dto';
import { UpdateRequestServicesDto } from './dto/update.dto';
export declare class RequestServicesService {
    private readonly requestServicesRepository;
    constructor(requestServicesRepository: Repository<RequestServices>);
    create(createRequestServicesDto: CreateRequestServicesDto): Promise<RequestServices>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        data: RequestServices[];
        total: number;
    }>;
    findOne(id: string): Promise<RequestServices>;
    findType(type: string): Promise<RequestServices[]>;
    update(id: string, updateRequestServicesDto: UpdateRequestServicesDto): Promise<RequestServices>;
    rating(id: string, rate: any): Promise<RequestServices>;
    remove(id: string): Promise<void>;
    sendSms(data: any, message: string, number: string): Promise<void>;
}
