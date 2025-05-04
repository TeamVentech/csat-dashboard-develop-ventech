import { Module } from '@nestjs/common';
import { TransactionSurveyController } from './transactionSurvey.controller';
import { TransactionSurveyService } from './transactionSurvey.service';
import { TransactionSurveyProvider } from './transactionSurvey.provider';
import { DatabaseModule } from '../database/database.module';
import { TouchPointsModule } from 'touchpoint/touch-points.module';
import { RolesModule } from 'roles/roles.module';
import { ComplaintsModule } from 'complaint/complaint.module';
import { CustomersModule } from 'customers/customers.module';
import { ElasticSearchModule } from '../ElasticSearch/elasticsearch.module';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionReportService } from './services/transaction-report.service';
import { TransactionReportController } from './controllers/transaction-report.controller';

@Module({
  imports: [
    DatabaseModule, 
    TouchPointsModule, 
    RolesModule, 
    CustomersModule, 
    ComplaintsModule,
    ElasticSearchModule,
    CategoriesModule
  ],
  controllers: [TransactionSurveyController, TransactionReportController],
  providers: [
    TransactionSurveyService, 
    ...TransactionSurveyProvider,
    TransactionReportService
  ],
})
export class TransactionSurveyModule {}

