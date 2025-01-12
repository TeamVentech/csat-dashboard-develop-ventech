import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { Vouchers } from './entities/vouchers.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VouchersProvider } from './vouchers.provider';
import { DatabaseModule } from '../database/database.module';
import { RolesModule } from 'roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [VouchersController],
  providers: [VouchersService, ...VouchersProvider]
})
export class VouchersModule {}

