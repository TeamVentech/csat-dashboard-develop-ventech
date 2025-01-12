import { Repository } from 'typeorm';
import { Tenant } from './entities/tenants.entity';
import { CreateTenantDto } from './dto/create.dto';
import { UpdateTenantDto } from './dto/update.dto';
export declare class TenantsService {
    private readonly tenantRepository;
    constructor(tenantRepository: Repository<Tenant>);
    create(createTenantDto: CreateTenantDto): Promise<Tenant>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        categories: Tenant[];
        total: number;
    }>;
    findOne(id: string): Promise<Tenant>;
    update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant>;
    remove(id: string): Promise<void>;
}
