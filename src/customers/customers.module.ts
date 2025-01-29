import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomersProvider } from './customers.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule ],
  controllers: [CustomersController],
  providers: [CustomersService, ...CustomersProvider],
  exports:[CustomersService]
})
export class CustomersModule {}
