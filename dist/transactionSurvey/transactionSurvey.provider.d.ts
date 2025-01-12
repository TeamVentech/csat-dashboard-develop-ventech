import { DataSource } from 'typeorm';
import { TransactionSurvey } from './entities/transactionSurvey.entity';
import { Touchpoint } from 'touchpoint/entities/touchpoint.entity';
export declare const TransactionSurveyProvider: ({
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<TransactionSurvey>;
    inject: string[];
} | {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Touchpoint>;
    inject: string[];
})[];
