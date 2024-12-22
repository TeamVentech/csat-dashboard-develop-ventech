import { Module } from '@nestjs/common';
import { TransactionSurveyController } from './transactionSurvey.controller';
import { TransactionSurveyService } from './transactionSurvey.service';
import { TransactionSurveyProvider } from './transactionSurvey.provider';
import { DatabaseModule } from '../database/database.module';
import { TouchPointsModule } from 'touchpoint/touch-points.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule, TouchPointsModule, RolesModule],
  controllers: [TransactionSurveyController],
  providers: [TransactionSurveyService, ...TransactionSurveyProvider],

})
export class TransactionSurveyModule {}

