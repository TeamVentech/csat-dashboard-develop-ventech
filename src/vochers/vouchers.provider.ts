import { DataSource } from 'typeorm';
import { Vouchers } from './entities/vouchers.entity';
import { RequestServices } from 'requestServices/entities/requestServices.entity';

export const VouchersProvider = [
  {
    provide: 'REQUEST_SERVICES_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(RequestServices),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'VOUCHERS_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Vouchers),
    inject: ['DATA_SOURCE'],
  },
];
