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
import { FoundChildChartDto } from 'requestServices/dto/found-child-chart.dto';
import { FoundChildStatisticsService } from '../services/found-child-statistics.service';
import { FoundChildLocationChartDto } from 'requestServices/dto/found-child-location-chart.dto';
import { FoundChildDurationDto } from 'requestServices/dto/found-child-duration.dto';

  @Controller('found-child-statistics')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseInterceptors(TransformInterceptor)
  export class FoundChildStatisticsController {
    constructor(private readonly foundChildStatisticsService: FoundChildStatisticsService) {}
  
    @Post('chart')
    @Permissions('Customer Care Center::read')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    getFoundChildChartData(@Body() filters: FoundChildChartDto) {
      return this.foundChildStatisticsService.getFoundChildChartData(filters);
    }
  
    @Post('location-chart')
    @Permissions('Customer Care Center::read')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    getFoundChildLocationChartData(@Body() filters: FoundChildLocationChartDto) {
      return this.foundChildStatisticsService.getFoundChildLocationChartData(filters);
    }
  
    @Post('duration')
    @Permissions('Customer Care Center::read')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    getFoundChildDurationData(@Body() filters: FoundChildDurationDto) {
      return this.foundChildStatisticsService.getFoundChildDurationData(filters);
    }
  } 