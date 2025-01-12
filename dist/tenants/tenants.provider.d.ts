import { DataSource } from 'typeorm';
import { Tenant } from './entities/tenants.entity';
export declare const TenantsProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Tenant>;
    inject: string[];
}[];
