import { DataSource } from 'typeorm';
import { Services } from './entities/services.entity';

export const ServicesProvider = [
  {
    provide: 'SERVICES_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Services),
    inject: ['DATA_SOURCE'],
  },
];
