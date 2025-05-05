import { Module, forwardRef } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Comment } from './entities/comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { ComplaintsModule } from 'complaint/complaint.module';
import { TouchPointsModule } from 'touchpoint/touch-points.module';
import { RequestServicesModule } from 'requestServices/requestServices.module';

@Module({
  imports: [
    DatabaseModule, 
    TypeOrmModule.forFeature([Comment]),
    RolesModule, 
    forwardRef(() => TouchPointsModule),
    forwardRef(() => ComplaintsModule),
    forwardRef(() => RequestServicesModule),
  ],
  controllers: [CommentController],
  providers: [
    {
      provide: 'COMMENT_REPOSITORY',
      useFactory: (dataSource) => dataSource.getRepository(Comment),
      inject: ['DATA_SOURCE'],
    },
    CommentService
  ],
  exports: [CommentService, 'COMMENT_REPOSITORY']
})
export class CommentModule {}

