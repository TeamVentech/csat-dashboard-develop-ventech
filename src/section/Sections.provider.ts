import { DataSource } from 'typeorm';
import { Section } from './entities/Sections.entity';
import { Role } from '../roles/entities/roles.entity';

export const SectionProvider = [
  {
    provide: 'SECTIONS_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Section),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'ROLE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Role),
    inject: ['DATA_SOURCE'],
  },
];
