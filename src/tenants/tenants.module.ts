import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantsProvider } from './tenants.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule ],
  controllers: [TenantsController],
  providers: [TenantsService, ...TenantsProvider],
  exports: [TenantsService]
})
export class TenantsModule {}
