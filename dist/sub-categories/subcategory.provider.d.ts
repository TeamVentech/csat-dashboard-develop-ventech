import { DataSource } from 'typeorm';
import { SubCategory } from './entities/subcategories.entity';
export declare const SubCategoryProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<SubCategory>;
    inject: string[];
}[];
