import { DataSource } from 'typeorm';
import { Role } from './entities/roles.entity';

export const RoleProvider = [
  {
    provide: 'ROLE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Role),
    inject: ['DATA_SOURCE'],
  },
];
