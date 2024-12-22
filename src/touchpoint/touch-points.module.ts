import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TouchPointsController } from './touch-points.controller';
import { TouchPointsService } from './touch-points.service';
import { TouchPointProvider } from './touchPoint.provider';
import { DatabaseModule } from '../database/database.module';
import { CategoriesModule } from 'categories/categories.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule, CategoriesModule, RolesModule],
  controllers: [TouchPointsController],
  providers: [TouchPointsService, ...TouchPointProvider],
  exports: [TouchPointsService],
})
export class TouchPointsModule { }
