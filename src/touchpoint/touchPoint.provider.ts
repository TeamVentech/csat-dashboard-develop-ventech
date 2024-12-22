import { DataSource } from 'typeorm';
import { TouchPoint } from './entities/touchpoint.entity';

export const TouchPointProvider = [
  {
    provide: 'TOUCHPOINT_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(TouchPoint),
    inject: ['DATA_SOURCE'],
  },
];
