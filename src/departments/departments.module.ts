import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { Department } from './entities/departments.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentProvider } from './departments.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';

@Module({
  imports: [DatabaseModule, RolesModule, ElasticSearchModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, ...DepartmentProvider]
})
export class DepartmentsModule {}

