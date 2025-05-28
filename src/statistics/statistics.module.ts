import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';
import { RequestServicesModule } from 'requestServices/requestServices.module';
import { VouchersModule } from 'vochers/vouchers.module';
import { ComplaintsModule } from 'complaint/complaint.module';
import { CommentModule } from 'comment/comment.module';
import { VouchersProvider } from 'vochers/vouchers.provider';
import { ComplaintsProvider } from 'complaint/complaint.provider';
import { CommentProvider } from 'comment/comment.provider';
import { DatabaseModule } from 'database/database.module';

@Module({
  imports: [
    DatabaseModule,
    ElasticSearchModule,
    RequestServicesModule,
    VouchersModule,
    ComplaintsModule,
    CommentModule
  ],
  controllers: [StatisticsController],
  providers: [
    ...VouchersProvider,
    ...ComplaintsProvider,
    ...CommentProvider,
    StatisticsService
  ],
  exports: [StatisticsService],
})
export class StatisticsModule {} 