import { DataSource } from 'typeorm';
import { RequestServices } from './entities/requestServices.entity';

export const RequestServicesProvider = [
  {
    provide: 'REQUEST_SERVICES_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(RequestServices),
    inject: ['DATA_SOURCE'],
  },
];
