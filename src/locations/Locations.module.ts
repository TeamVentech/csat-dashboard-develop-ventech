import { Module } from '@nestjs/common';
import { LocationsController } from './Locations.controller';
import { LocationsService } from './Locations.service';
import { LocationProvider } from './Locations.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [LocationsController],
  providers: [LocationsService, ...LocationProvider]
})
export class LocationsModule {}

