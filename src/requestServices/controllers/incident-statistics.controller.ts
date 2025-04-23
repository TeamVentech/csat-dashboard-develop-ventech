import {
  Controller, Post, Body, UseGuards, UseInterceptors, ClassSerializerInterceptor
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorator/permissions.decorator';
import { TransformInterceptor } from '../../interceptors/transform.interceptor';
import { IncidentStatisticsService } from '../services/incident-statistics.service';
import { IncidentReportChartDto } from '../dto/incident-report-chart.dto';
import { IncidentLocationChartDto } from '../dto/incident-location-chart.dto';
import { RatingStatisticsDto } from '../dto/rating-statistics.dto';
import { RatingByPeriodDto } from '../dto/rating-by-period.dto';

@Controller('incident-statistics')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class IncidentStatisticsController {
  constructor(private readonly incidentStatisticsService: IncidentStatisticsService) {}

  @Post('type-chart')
  @Permissions('Customer Care Center::read')
  getIncidentTypeChartData(@Body() filters: IncidentReportChartDto) {
    return this.incidentStatisticsService.getIncidentTypeChartData(filters);
  }

  @Post('location-chart')
  @Permissions('Customer Care Center::read')
  getIncidentLocationChartData(@Body() filters: IncidentLocationChartDto) {
    return this.incidentStatisticsService.getIncidentLocationChartData(filters);
  }

  @Post('rating-statistics')
  @Permissions('Customer Care Center::read')
  getRatingStatistics(@Body() filters: RatingStatisticsDto) {
    return this.incidentStatisticsService.getRatingStatistics(filters);
  }

  @Post('rating-by-period')
  @Permissions('Customer Care Center::read')
  getRatingByPeriod(@Body() filters: RatingByPeriodDto) {
    return this.incidentStatisticsService.getRatingByPeriod(filters);
  }
} 