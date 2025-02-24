import { forwardRef, Module } from '@nestjs/common';
import { ComplaintsController } from './complaint.controller';
import { ComplaintsService } from './complaint.service';
import { Complaints } from './entities/complaint.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplaintsProvider } from './complaint.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';
// import { NotificationsGateway } from 'notifications/notifications.gateway';
import { TasksModule } from 'userTask/task.module';
import { TouchPointsModule } from 'touchpoint/touch-points.module';

@Module({
  imports: [DatabaseModule, RolesModule, ElasticSearchModule, forwardRef(() => TasksModule), TouchPointsModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, ...ComplaintsProvider],
  exports: [ComplaintsService]

})
export class ComplaintsModule {}

