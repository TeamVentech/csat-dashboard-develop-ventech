import { Repository } from 'typeorm';
import { Services } from './entities/services.entity';
import { CreateServicesDto } from './dto/create.dto';
import { UpdateServicesDto } from './dto/update.dto';
export declare class ServicesService {
    private readonly servicesRepository;
    constructor(servicesRepository: Repository<Services>);
    create(createServicesDto: CreateServicesDto): Promise<Services>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        data: Services[];
        total: number;
    }>;
    getServiceStatusCounts(type: string): Promise<{
        AVAILABLE: number;
        UNAVAILABLE: number;
        OCCUPIED: number;
    }>;
    findOne(id: string): Promise<Services>;
    findOneByTypeStatus(type: string, status: string): Promise<Services>;
    update(id: string, updateServicesDto: UpdateServicesDto): Promise<Services>;
    remove(id: string): Promise<void>;
}
