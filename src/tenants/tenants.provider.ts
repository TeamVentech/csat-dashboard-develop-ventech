import { DataSource } from 'typeorm';
import { Tenant } from './entities/tenants.entity';

export const TenantsProvider = [
  {
    provide: 'TENANTS_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Tenant),
    inject: ['DATA_SOURCE'],
  },
];
