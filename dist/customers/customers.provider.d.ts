import { DataSource } from 'typeorm';
import { Customer } from './entities/customers.entity';
export declare const CustomersProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Customer>;
    inject: string[];
}[];
