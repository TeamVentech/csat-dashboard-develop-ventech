import {
  Controller, Post, Body, UseGuards, UseInterceptors, ClassSerializerInterceptor
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorator/permissions.decorator';
import { TransformInterceptor } from '../../interceptors/transform.interceptor';
import { LostItemStatisticsService } from '../services/lost-item-statistics.service';
import { LostItemChartDto } from '../dto/lost-item-chart.dto';
import { LostItemLocationChartDto } from '../dto/lost-item-location-chart.dto';
import { LostItemDurationDto } from '../dto/lost-item-duration.dto';
import { LostItemStateChartDto } from '../dto/lost-item-state-chart.dto';

@Controller('item-statistics')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class LostItemStatisticsController {
  constructor(private readonly lostItemStatisticsService: LostItemStatisticsService) {}

  @Post('chart')
  @Permissions('Customer Care Center::read')
  getLostItemChartData(@Body() filters: LostItemChartDto) {
    return this.lostItemStatisticsService.getLostItemChartData(filters);
  }

  @Post('location-chart')
  @Permissions('Customer Care Center::read')
  getLostItemLocationData(@Body() filters: LostItemLocationChartDto) {
    return this.lostItemStatisticsService.getLostItemLocationData(filters);
  }

  @Post('duration')
  @Permissions('Customer Care Center::read')
  getLostItemDurationData(@Body() filters: LostItemDurationDto) {
    return this.lostItemStatisticsService.getLostItemDurationData(filters);
  }

  @Post('state-chart')
  @Permissions('Customer Care Center::read')
  getLostItemStateChartData(@Body() filters: LostItemStateChartDto) {
    return this.lostItemStatisticsService.getLostItemStateChartData(filters);
  }
} 