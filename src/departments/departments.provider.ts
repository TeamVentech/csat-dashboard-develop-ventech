import { DataSource } from 'typeorm';
import { Department } from './entities/departments.entity';

export const DepartmentProvider = [
  {
    provide: 'DEPARTMENT_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Department),
    inject: ['DATA_SOURCE'],
  },
];
