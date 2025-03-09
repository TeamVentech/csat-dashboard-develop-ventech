import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FilesS3Service } from './aws-storage.service';

@Module({
  imports: [DatabaseModule],
  providers: [FilesS3Service],
  exports: [FilesS3Service],
})
export class FilesS3Module {}
