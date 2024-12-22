import { DataSource } from 'typeorm';
import { Location } from './entities/Locations.entity';
export declare const LocationProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Location>;
    inject: string[];
}[];
