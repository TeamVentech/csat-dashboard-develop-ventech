import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { DatabaseModule } from '../database/database.module';
import { messageProviders } from './messages.provider';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [MessagesController],
  providers: [
    ...messageProviders,
    MessagesService,
  ],
  exports: [MessagesService],
})
export class MessagesModule {} 