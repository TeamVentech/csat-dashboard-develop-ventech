import { Module } from '@nestjs/common';
import { ComplaintsController } from './complaint.controller';
import { ComplaintsService } from './complaint.service';
import { Complaints } from './entities/complaint.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplaintsProvider } from './complaint.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, ...ComplaintsProvider],
  exports: [ComplaintsService],

})
export class ComplaintsModule { }

