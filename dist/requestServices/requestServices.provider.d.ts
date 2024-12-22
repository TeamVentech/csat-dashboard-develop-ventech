import { DataSource } from 'typeorm';
import { RequestServices } from './entities/requestServices.entity';
export declare const RequestServicesProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<RequestServices>;
    inject: string[];
}[];
