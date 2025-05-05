import {
  Controller, Get, UseGuards, UseInterceptors, ClassSerializerInterceptor
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorator/permissions.decorator';
import { TransformInterceptor } from '../../interceptors/transform.interceptor';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('status')
  @Permissions('Customer Care Center::read')
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('services')
  @Permissions('Customer Care Center::read')
  async getDashboardService() {
    return this.dashboardService.getDashboardService();
  }

  @Get('vouchers')
  @Permissions('Customer Care Center::read')
  async getDashboardVouchers() {
    return this.dashboardService.getDashboardVouchers();
  }

  @Get('feedback')
  @Permissions('Customer Care Center::read')
  async getDashboardFeedback() {
    return this.dashboardService.getDashboardFeedback();
  }
} 