import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/roles.entity';
import { RoleProvider } from './roles.provider';
import { DatabaseModule } from '../database/database.module';
import { SectionsService } from 'section/Sections.service';
import { SectionsModule } from 'section/Sections.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RolesController],
  providers: [RolesService, ...RoleProvider],
  exports:[RolesService]
})
export class RolesModule {}
