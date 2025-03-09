import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UsersProvider } from './users.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';
import { FilesS3Module } from 'azure-storage/aws-storage.module';

@Module({
  imports: [DatabaseModule, RolesModule, FilesS3Module],
  controllers: [UsersController],
  exports: [UsersService],
  providers: [UsersService, ...UsersProvider],
})
export class UsersModule {}
