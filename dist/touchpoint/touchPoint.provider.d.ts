import { DataSource } from 'typeorm';
import { TouchPoint } from './entities/touchpoint.entity';
export declare const TouchPointProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<TouchPoint>;
    inject: string[];
}[];
