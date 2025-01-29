import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { Services } from './entities/services.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesProvider } from './services.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ServicesController],
  providers: [ServicesService, ...ServicesProvider],
  exports: [ServicesService],

})
export class ServicesModule { }

