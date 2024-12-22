import { DataSource } from 'typeorm';
import { Customer } from './entities/customers.entity';

export const CustomersProvider = [
  {
    provide: 'CUSTOMERS_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Customer),
    inject: ['DATA_SOURCE'],
  },
];
