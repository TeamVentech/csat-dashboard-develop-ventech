import { DataSource } from 'typeorm';
import { Complaints } from './entities/complaint.entity';
export declare const ComplaintsProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Complaints>;
    inject: string[];
}[];
