import { Module } from '@nestjs/common';
import { RequestServicesController } from './requestServices.controller';
import { RequestServicesService } from './requestServices.service';
import { RequestServices } from './entities/requestServices.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestServicesProvider } from './requestServices.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';
import { VouchersModule } from 'vochers/vouchers.module';
import { ServicesModule } from 'service/services.module';
import { CustomersModule } from 'customers/customers.module';

@Module({
  imports: [DatabaseModule, RolesModule, ElasticSearchModule, VouchersModule, ServicesModule, CustomersModule],
  controllers: [RequestServicesController],
  providers: [RequestServicesService, ...RequestServicesProvider],
  exports:[RequestServicesService]
})
export class RequestServicesModule {}

