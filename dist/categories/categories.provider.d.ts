import { DataSource } from 'typeorm';
import { Category } from './entities/categories.entity';
export declare const categoryProviders: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Category>;
    inject: string[];
}[];
