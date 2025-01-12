import { DataSource } from 'typeorm';
import { ComplaintCategory } from './entities/complaintCategory.entity';
export declare const complaintCategoryProviders: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<ComplaintCategory>;
    inject: string[];
}[];
