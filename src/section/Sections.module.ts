import { Module } from '@nestjs/common';
import { SectionsController } from './Sections.controller';
import { SectionsService } from './Sections.service';
import { SectionProvider } from './Sections.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [SectionsController],
  providers: [SectionsService, ...SectionProvider],
})
export class SectionsModule {}

