import { Module } from '@nestjs/common';
import { TasksController } from './task.controller';
import { TasksService } from './task.service';
import { Tasks } from './entities/task.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksProvider } from './task.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';

@Module({
  imports: [DatabaseModule, RolesModule, ElasticSearchModule],
  controllers: [TasksController],
  providers: [TasksService, ...TasksProvider],
  exports: [TasksService],

})
export class TasksModule { }

