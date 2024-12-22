import { DataSource } from 'typeorm';
import { Role } from './entities/roles.entity';
export declare const RoleProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Role>;
    inject: string[];
}[];
