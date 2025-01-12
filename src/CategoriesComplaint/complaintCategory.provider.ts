import { DataSource } from 'typeorm';
import { ComplaintCategory } from './entities/complaintCategory.entity';

export const complaintCategoryProviders = [
  {
    provide: 'COMPLAINT_CATEGORY_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ComplaintCategory),
    inject: ['DATA_SOURCE'],
  },
];
