import { DataSource } from 'typeorm';
import { Corporate } from './entities/corporates.entity';
export declare const CorporatesProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Corporate>;
    inject: string[];
}[];
