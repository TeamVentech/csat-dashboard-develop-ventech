import {
  Controller, Post, Body, UseGuards, UseInterceptors, ClassSerializerInterceptor, Get
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorator/permissions.decorator';
import { TransformInterceptor } from '../../interceptors/transform.interceptor';
import { PowerBankStatisticsService } from '../services/powerbank-statistics.service';
import { PowerBankChartDto } from '../dto/powerbank-chart.dto';

@Controller('powerbank-statistics')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class PowerBankStatisticsController {
  constructor(private readonly powerBankStatisticsService: PowerBankStatisticsService) {}

  @Post('chart-data')
  @Permissions('Customer Care Center::read')
  async getPowerBankChartData(@Body() chartDto: PowerBankChartDto) {
    return this.powerBankStatisticsService.getPowerBankChartData(chartDto);
  }

  @Post('average-duration')
  @Permissions('Customer Care Center::read')
  async getAverageDurationData(@Body() chartDto: PowerBankChartDto) {
    return this.powerBankStatisticsService.getAverageDurationData(chartDto);
  }

  @Post('damaged-cases')
  @Permissions('Customer Care Center::read')
  async getDamagedCasesData(@Body() chartDto: PowerBankChartDto) {
    return this.powerBankStatisticsService.getDamagedCasesData(chartDto);
  }

  @Post('not-returned-items')
  @Permissions('Customer Care Center::read')
  async getNotReturnedItemsData(@Body() chartDto: PowerBankChartDto) {
    return this.powerBankStatisticsService.getNotReturnedItemsData(chartDto);
  }

  @Post('delivery-pickup-services')
  @Permissions('Customer Care Center::read')
  async getDeliveryPickupServicesData(@Body() chartDto: PowerBankChartDto) {
    return this.powerBankStatisticsService.getDeliveryPickupServicesData(chartDto);
  }

  @Post('request-source-report')
  @Permissions('Customer Care Center::read')
  async getRequestSourceReportData(@Body() chartDto: PowerBankChartDto) {
    return this.powerBankStatisticsService.getRequestSourceReportData(chartDto);
  }

  @Get('not-returned-items-count')
  @Permissions('Customer Care Center::read')
  async getNotReturnedItemsCount() {
    return this.powerBankStatisticsService.getNotReturnedItemsCount();
  }
} 