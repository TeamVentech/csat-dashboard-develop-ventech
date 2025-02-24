import { Module } from '@nestjs/common';
import { CronsService } from './cron.service';
import { CronProvider } from './cron.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';
import { TasksModule } from 'userTask/task.module';

@Module({
  imports: [DatabaseModule, RolesModule, ElasticSearchModule, TasksModule],
  providers: [CronsService, ...CronProvider],
  exports:[CronsService]
})
export class CronModule {}

