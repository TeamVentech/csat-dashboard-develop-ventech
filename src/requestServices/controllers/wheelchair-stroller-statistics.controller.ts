import {
  Controller, Post, Body, UseGuards, UseInterceptors, ClassSerializerInterceptor
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorator/permissions.decorator';
import { TransformInterceptor } from '../../interceptors/transform.interceptor';
import { WheelchairStrollerStatisticsService } from '../services/wheelchair-stroller-statistics.service';
import { WheelchairStrollerChartDto } from '../dto/wheelchair-stroller-chart.dto';

@Controller('wheelchair-stroller-statistics')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class WheelchairStrollerStatisticsController {
  constructor(private readonly wheelchairStrollerStatisticsService: WheelchairStrollerStatisticsService) {}

  @Post('chart-data')
  @Permissions('Customer Care Center::read')
  async getWheelchairStrollerChartData(@Body() chartDto: WheelchairStrollerChartDto) {
    return this.wheelchairStrollerStatisticsService.getWheelchairStrollerChartData(chartDto);
  }

  @Post('average-duration')
  @Permissions('Customer Care Center::read')
  async getAverageDurationData(@Body() chartDto: WheelchairStrollerChartDto) {
    return this.wheelchairStrollerStatisticsService.getAverageDurationData(chartDto);
  }

  @Post('damaged-cases')
  @Permissions('Customer Care Center::read')
  async getDamagedCasesData(@Body() chartDto: WheelchairStrollerChartDto) {
    return this.wheelchairStrollerStatisticsService.getDamagedCasesData(chartDto);
  }

  @Post('not-returned-items')
  @Permissions('Customer Care Center::read')
  async getNotReturnedItemsData(@Body() chartDto: WheelchairStrollerChartDto) {
    return this.wheelchairStrollerStatisticsService.getNotReturnedItemsData(chartDto);
  }

  @Post('delivery-pickup-services')
  @Permissions('Customer Care Center::read')
  async getDeliveryPickupServicesData(@Body() chartDto: WheelchairStrollerChartDto) {
    return this.wheelchairStrollerStatisticsService.getDeliveryPickupServicesData(chartDto);
  }

  @Post('request-source-report')
  @Permissions('Customer Care Center::read')
  async getRequestSourceReportData(@Body() chartDto: WheelchairStrollerChartDto) {
    return this.wheelchairStrollerStatisticsService.getRequestSourceReportData(chartDto);
  }
} 