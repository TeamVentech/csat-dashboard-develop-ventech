import { Module } from '@nestjs/common';
import { RequestServicesController } from './requestServices.controller';
import { RequestServicesService } from './requestServices.service';
import { RequestServices } from './entities/requestServices.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';
import { VouchersModule } from 'vochers/vouchers.module';
import { ServicesModule } from 'service/services.module';
import { CustomersModule } from 'customers/customers.module';
import { WheelchairStrollerHandler } from './handlers/wheelchair-stroller.handler';
import { PowerBankHandler } from './handlers/power-bank.handler';
import { HandsfreeHandler } from './handlers/handsfree.handler';
import { SmsService } from './services/sms.service';
import { ComplaintsModule } from 'complaint/complaint.module';
import { AddedValueServiceHandler } from './handlers/added-value-service.handler';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([RequestServices]),
    RolesModule,
    ElasticSearchModule,
    VouchersModule,
    ServicesModule,
    CustomersModule,
    ComplaintsModule,
  ],
  controllers: [RequestServicesController],
  providers: [
    {
      provide: 'REQUEST_SERVICES_REPOSITORY',
      useFactory: (dataSource) => dataSource.getRepository(RequestServices),
      inject: ['DATA_SOURCE'],
    },
    RequestServicesService,
    WheelchairStrollerHandler,
    PowerBankHandler,
    HandsfreeHandler,
    SmsService,
    AddedValueServiceHandler,
  ],
  exports: [RequestServicesService]
})
export class RequestServicesModule {}

