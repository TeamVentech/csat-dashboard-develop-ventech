import { Module } from '@nestjs/common';
import { TransactionSurveyController } from './transactionSurvey.controller';
import { TransactionSurveyService } from './transactionSurvey.service';
import { TransactionSurveyProvider } from './transactionSurvey.provider';
import { DatabaseModule } from '../database/database.module';
import { TouchPointsModule } from 'touchpoint/touch-points.module';
import { RolesModule } from 'roles/roles.module';
import { ComplaintsModule } from 'complaint/complaint.module';
import { CustomersModule } from 'customers/customers.module';

@Module({
  imports: [DatabaseModule, TouchPointsModule, RolesModule, CustomersModule, ComplaintsModule],
  controllers: [TransactionSurveyController],
  providers: [TransactionSurveyService, ...TransactionSurveyProvider],

})
export class TransactionSurveyModule {}

