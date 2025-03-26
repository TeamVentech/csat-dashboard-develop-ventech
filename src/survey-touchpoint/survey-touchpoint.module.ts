import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyTouchpointService } from './survey-touchpoint.service';
import { SurveyTouchpointController } from './survey-touchpoint.controller';
import { SurveyTouchpoint } from './entities/survey-touchpoint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyTouchpoint])],
  controllers: [SurveyTouchpointController],
  providers: [SurveyTouchpointService],
  exports: [SurveyTouchpointService],
})
export class SurveyTouchpointModule {} 