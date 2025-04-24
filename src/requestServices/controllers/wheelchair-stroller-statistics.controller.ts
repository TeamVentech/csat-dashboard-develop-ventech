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

  @Post('chart')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getWheelchairStrollerChartData(@Body() filters: WheelchairStrollerChartDto) {
    return this.wheelchairStrollerStatisticsService.getWheelchairStrollerChartData(filters);
  }
} 