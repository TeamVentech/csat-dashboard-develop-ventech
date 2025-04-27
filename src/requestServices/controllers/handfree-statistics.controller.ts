import {
  Controller, Post, Body, UseGuards, UseInterceptors, ClassSerializerInterceptor, Get
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorator/permissions.decorator';
import { TransformInterceptor } from '../../interceptors/transform.interceptor';
import { HandfreeStatisticsService } from '../services/handfree-statistics.service';
import { HandfreeChartDto } from '../dto/handfree-chart.dto';

@Controller('handfree-statistics')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class HandfreeStatisticsController {
  constructor(private readonly handfreeStatisticsService: HandfreeStatisticsService) {}

  @Post('chart-data')
  @Permissions('Customer Care Center::read')
  async getHandfreeChartData(@Body() chartDto: HandfreeChartDto) {
    return this.handfreeStatisticsService.getHandfreeChartData(chartDto);
  }

  @Post('average-duration')
  @Permissions('Customer Care Center::read')
  async getAverageDurationData(@Body() chartDto: HandfreeChartDto) {
    return this.handfreeStatisticsService.getAverageDurationData(chartDto);
  }


  @Post('delivery-pickup-services')
  @Permissions('Customer Care Center::read')
  async getDeliveryPickupServicesData(@Body() chartDto: HandfreeChartDto) {
    return this.handfreeStatisticsService.getDeliveryPickupServicesData(chartDto);
  }

  @Post('request-source-report')
  @Permissions('Customer Care Center::read')
  async getRequestSourceReportData(@Body() chartDto: HandfreeChartDto) {
    return this.handfreeStatisticsService.getRequestSourceReportData(chartDto);
  }
} 