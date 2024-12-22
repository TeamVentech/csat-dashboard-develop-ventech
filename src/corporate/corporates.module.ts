import { Module } from '@nestjs/common';
import { CorporatesController } from './corporates.controller';
import { CorporatesService } from './corporates.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CorporatesProvider } from './corporates.provider';
import { Category } from '../categories/entities/categories.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Corporate } from './entities/corporates.entity';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [CorporatesController],
  providers: [CorporatesService, ...CorporatesProvider]
})
export class CorporatesModule {}
