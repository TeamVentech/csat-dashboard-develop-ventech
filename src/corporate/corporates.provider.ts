import { DataSource } from 'typeorm';
import { Corporate } from './entities/corporates.entity';

export const CorporatesProvider = [
  {
    provide: 'CORPORTES_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Corporate),
    inject: ['DATA_SOURCE'],
  },
];
