import { DataSource } from 'typeorm';
import { Surveys } from './entities/Surveys.entity';

export const SurveysProvider = [
  {
    provide: 'SURVEYS_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Surveys),
    inject: ['DATA_SOURCE'],
  },
];
