import { DataSource } from 'typeorm';
import { Touchpoint } from './entities/touchpoint.entity';

export const TouchPointProvider = [
  {
    provide: 'TOUCHPOINT_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Touchpoint),
    inject: ['DATA_SOURCE'],
  },
];
