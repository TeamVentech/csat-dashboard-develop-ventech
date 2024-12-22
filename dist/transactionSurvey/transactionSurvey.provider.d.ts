import { DataSource } from 'typeorm';
import { TransactionSurvey } from './entities/transactionSurvey.entity';
import { TouchPoint } from 'touchpoint/entities/touchpoint.entity';
export declare const TransactionSurveyProvider: ({
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<TransactionSurvey>;
    inject: string[];
} | {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<TouchPoint>;
    inject: string[];
})[];
