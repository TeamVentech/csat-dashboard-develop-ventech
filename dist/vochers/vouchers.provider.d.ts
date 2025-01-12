import { DataSource } from 'typeorm';
import { Vouchers } from './entities/vouchers.entity';
export declare const VouchersProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Vouchers>;
    inject: string[];
}[];
