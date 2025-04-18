import { forwardRef, Module } from '@nestjs/common';
import { TasksController } from './task.controller';
import { TasksServices } from './task.service';
import { Tasks } from './entities/task.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksProvider } from './task.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';
import { TouchPointsModule } from 'touchpoint/touch-points.module';
import { ComplaintsModule } from 'complaint/complaint.module';
import { UsersModule } from 'users/users.module';
import { AppModule } from 'app.module';
import { EmailModule } from 'email/email.module';
import { FilesS3Module } from 'azure-storage/aws-storage.module';
import { SmsModule } from 'sms/sms.module';
// import { ComplaintsModule } from 'complaint/complaint.module';

@Module({
  imports: [
    DatabaseModule,
    RolesModule,
    ElasticSearchModule,
    FilesS3Module,
    forwardRef(() => TouchPointsModule),
    UsersModule,
    EmailModule,
    SmsModule
  ],
  controllers: [TasksController],
  providers: [TasksServices, ...TasksProvider],
  exports: [TasksServices],
})
export class TasksModule { }

