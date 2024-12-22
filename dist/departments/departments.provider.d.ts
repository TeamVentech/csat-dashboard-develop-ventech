import { DataSource } from 'typeorm';
import { Department } from './entities/departments.entity';
export declare const DepartmentProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Department>;
    inject: string[];
}[];
