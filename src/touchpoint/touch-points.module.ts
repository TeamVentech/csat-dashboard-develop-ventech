import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TouchPointsController } from './touch-points.controller';
import { TouchPointsService } from './touch-points.service';
import { TouchPointProvider } from './touchPoint.provider';
import { DatabaseModule } from '../database/database.module';
import { CategoriesModule } from 'categories/categories.module';
import { RolesModule } from 'roles/roles.module';
import { FilesS3Module } from 'azure-storage/aws-storage.module';

@Module({
  imports: [DatabaseModule, CategoriesModule, RolesModule, FilesS3Module],
  controllers: [TouchPointsController],
  providers: [TouchPointsService, ...TouchPointProvider],
  exports: [TouchPointsService],
})
export class TouchPointsModule { }
