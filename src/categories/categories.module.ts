import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/categories.entity';
import { categoryProviders } from './categories.provider';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, ...categoryProviders],
  exports: [CategoriesService, ...categoryProviders], // Ensure you export the provider
})
export class CategoriesModule {}
