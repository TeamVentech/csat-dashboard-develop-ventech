import { DataSource } from 'typeorm';
import { Surveys } from './entities/Surveys.entity';
export declare const SurveysProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Surveys>;
    inject: string[];
}[];
