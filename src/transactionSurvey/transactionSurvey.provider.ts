import { DataSource } from 'typeorm';
import { TransactionSurvey } from './entities/transactionSurvey.entity';
import { TouchPoint } from 'touchpoint/entities/touchpoint.entity';

export const TransactionSurveyProvider = [
  {
    provide: 'TRANSACTION_SURVEY_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(TransactionSurvey),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'TOUCHPOINT_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(TouchPoint),
    inject: ['DATA_SOURCE'],
  },
];
