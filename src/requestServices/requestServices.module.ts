import { Module } from '@nestjs/common';
import { RequestServicesController } from './requestServices.controller';
import { RequestServicesService } from './requestServices.service';
import { RequestServices } from './entities/requestServices.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestServicesProvider } from './requestServices.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';

@Module({
  imports: [DatabaseModule, RolesModule, ElasticSearchModule],
  controllers: [RequestServicesController],
  providers: [RequestServicesService, ...RequestServicesProvider]
})
export class RequestServicesModule {}

