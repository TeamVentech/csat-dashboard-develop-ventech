import { DataSource } from 'typeorm';
import { SubCategory } from './entities/subcategories.entity';

export const SubCategoryProvider = [
  {
    provide: 'SUBCATEGORY_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(SubCategory),
    inject: ['DATA_SOURCE'],
  },
];
