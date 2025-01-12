import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create.dto';
import { UpdateTenantDto } from './dto/update.dto';
import { Tenant } from './entities/tenants.entity';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    create(createTenantDto: CreateTenantDto): Promise<Tenant>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        categories: Tenant[];
        total: number;
    }>;
    findOne(id: string): Promise<Tenant>;
    update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant>;
    remove(id: string): Promise<void>;
}
