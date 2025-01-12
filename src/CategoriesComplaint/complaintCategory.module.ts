import { Module } from '@nestjs/common';
import { complaintCategoryProviders } from './complaintCategory.provider';
import { ComplaintCategoryService } from './complaintCategory.service';
import { CategoriesController } from './complaintCategory.controller';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [CategoriesController],
  providers: [ComplaintCategoryService, ...complaintCategoryProviders],
  exports: [ComplaintCategoryService, ...complaintCategoryProviders], // Ensure you export the provider
})
export class CategoriesModule {}
