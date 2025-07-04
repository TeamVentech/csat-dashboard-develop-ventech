import { Module } from '@nestjs/common';
import { CronsService } from './cron.service';
import { CronProvider } from './cron.provider';
import { DatabaseModule } from 'database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';
import { TasksModule } from 'userTask/task.module';
import { ComplaintsModule } from 'complaint/complaint.module';
import { RequestServicesModule } from 'requestServices/requestServices.module';
import { VouchersModule } from 'vochers/vouchers.module';
import { SmsModule } from 'sms/sms.module';

@Module({
  imports: [DatabaseModule, RolesModule, ElasticSearchModule, TasksModule, ComplaintsModule, RequestServicesModule, VouchersModule, SmsModule],
  providers: [CronsService, ...CronProvider],
  exports:[CronsService]
})
export class CronModule {}

