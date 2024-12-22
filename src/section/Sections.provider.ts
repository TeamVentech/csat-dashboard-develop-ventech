import { DataSource } from 'typeorm';
import { Section } from './entities/Sections.entity';

export const SectionProvider = [
  {
    provide: 'SECTIONS_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Section),
    inject: ['DATA_SOURCE'],
  },
];
