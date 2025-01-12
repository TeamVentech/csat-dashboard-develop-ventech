import { DataSource } from 'typeorm';
import { Vouchers } from './entities/vouchers.entity';

export const VouchersProvider = [
  {
    provide: 'VOUCHERS_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Vouchers),
    inject: ['DATA_SOURCE'],
  },
];
