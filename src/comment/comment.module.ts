import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Comment } from './entities/comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentProvider } from './comment.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ComplaintsModule } from 'complaint/complaint.module';
import { RequestServicesModule } from 'requestServices/requestServices.module';
import { TouchPointsModule } from 'touchpoint/touch-points.module';

@Module({
  imports: [DatabaseModule, RolesModule, RequestServicesModule,TouchPointsModule, ComplaintsModule],
  controllers: [CommentController],
  providers: [CommentService, ...CommentProvider]
})
export class CommentModule { }

