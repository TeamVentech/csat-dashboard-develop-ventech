import { DataSource } from 'typeorm';
import { Services } from './entities/services.entity';
export declare const ServicesProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Services>;
    inject: string[];
}[];
