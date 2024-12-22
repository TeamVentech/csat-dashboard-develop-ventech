import { Module } from '@nestjs/common';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { Surveys } from './entities/Surveys.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveysProvider } from './surveys.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule,RolesModule],
  controllers: [SurveysController],
  providers: [SurveysService, ...SurveysProvider]
})
export class SurveysModule {}

