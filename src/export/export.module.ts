import { Module } from '@nestjs/common';
import { ElasticSearchModule } from '../ElasticSearch/elasticsearch.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [
    ElasticSearchModule
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService]
})
export class ExportModule {} 