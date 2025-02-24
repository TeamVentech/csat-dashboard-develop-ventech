import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { Vouchers } from './entities/vouchers.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VouchersProvider } from './vouchers.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';
import { RequestServicesModule } from 'requestServices/requestServices.module';

@Module({
  imports: [DatabaseModule, RolesModule, ElasticSearchModule],
  controllers: [VouchersController],
  providers: [VouchersService, ...VouchersProvider],
  exports: [VouchersService],

})
export class VouchersModule { }

