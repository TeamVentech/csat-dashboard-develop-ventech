import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProductController } from './azure-storage.controller';
import { FilesAzureService } from './azure-storage.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductController],
  providers: [FilesAzureService],
  exports:[FilesAzureService]
})
export class FilesAzureModule {}

