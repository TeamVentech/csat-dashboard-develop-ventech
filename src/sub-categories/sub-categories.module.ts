import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubCategoriesController } from './sub-categories.controller';
import { SubCategoriesService } from './sub-categories.service';
import { SubCategory } from './entities/subcategories.entity';
import { Category } from '../categories/entities/categories.entity';
import { SubCategoryProvider } from './subcategory.provider';
import { DatabaseModule } from '../database/database.module';
import { CategoriesModule } from '../categories/categories.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [
    DatabaseModule,
    CategoriesModule,
    DatabaseModule,
    RolesModule
  ],
  controllers: [SubCategoriesController],
  providers: [SubCategoriesService, ...SubCategoryProvider],
})
export class SubCategoriesModule { }
