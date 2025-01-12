import { DataSource } from 'typeorm';
import { Touchpoint } from './entities/touchpoint.entity';
export declare const TouchPointProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Touchpoint>;
    inject: string[];
}[];
