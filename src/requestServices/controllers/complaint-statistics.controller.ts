import {
  Controller, Post, Body, UseGuards, UseInterceptors, ClassSerializerInterceptor, Get
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorator/permissions.decorator';
import { TransformInterceptor } from '../../interceptors/transform.interceptor';
import { ComplaintStatisticsService } from '../services/complaint-statistics.service';
import { ComplaintChartDto } from '../dto/complaints-chart.dto';
import { AnyARecord } from 'node:dns';

@Controller('complaint-statistics')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class ComplaintStatisticsController {
  constructor(private readonly complaintStatisticsService: ComplaintStatisticsService) {}

  @Post('chart-data')
  @Permissions('Customer Care Center::read')
  async getComplaintChartData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getComplaintChartData(chartDto);
  }

  @Post('chart-data-filter')
  @Permissions('Customer Care Center::read')
  async getComplaintChartDataFilter(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getComplaintChartDataFilter(chartDto);
  }


  @Post('average-duration')
  @Permissions('Customer Care Center::read')
  async getAverageDurationData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getAverageDurationData(chartDto);
  }

  @Post('damaged-cases')
  @Permissions('Customer Care Center::read')
  async getDamagedCasesData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getDamagedCasesData(chartDto);
  }

  @Post('not-returned-items')
  @Permissions('Customer Care Center::read')
  async getNotReturnedItemsData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getNotReturnedItemsData(chartDto);
  }

  @Post('delivery-pickup-services')
  @Permissions('Customer Care Center::read')
  async getDeliveryPickupServicesData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getDeliveryPickupServicesData(chartDto);
  }

  @Post('request-source-report')
  @Permissions('Customer Care Center::read')
  async getRequestSourceReportData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getRequestSourceReportData(chartDto);
  }

  @Post('closed-vs-status-report')
  @Permissions('Customer Care Center::read')
  async getClosedVsStatusReportData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getClosedVsStatusReportData(chartDto);
  }

  @Post('complaint-types-report')
  @Permissions('Customer Care Center::read')
  async getComplaintTypesReportData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getComplaintTypesReportData(chartDto);
  }

  @Post('sections-complaints-report')
  @Permissions('Customer Care Center::read')
  async getSectionsComplaintsReportData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getSectionsComplaintsReportData(chartDto);
  }

  @Post('sections-department-report')
  @Permissions('Customer Care Center::read')
  async getSectionsDepartmentReportData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getSectionsDepartmentReportData(chartDto);
  }

  @Post('repeated-customers-report')
  @Permissions('Customer Care Center::read')
  async getRepeatedCustomersData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getRepeatedCustomersData(chartDto);
  }

  @Post('complaints-status-report')
  @Permissions('Customer Care Center::read')
  async getComplaintsStatusReportData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getComplaintsKpiReportData(chartDto);
  }

  @Post('complaints-kpi-report')
  @Permissions('Customer Care Center::read')
  async getComplaintsKpiData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getComplaintsKpiReportData(chartDto);
  }

  @Post('shops-complaints-report')
  @Permissions('Customer Care Center::read')
  async getShopsComplaintsReportData(@Body() chartDto: ComplaintChartDto) {
    return this.complaintStatisticsService.getShopsComplaintsReportData(chartDto);
  }

  @Post('rating-statistics')
  @Permissions('Customer Care Center::read')
  getRatingStatistics(@Body() filters: any) {
    return this.complaintStatisticsService.getRatingStatistics(filters);
  }

  @Post('rating-by-period')
  @Permissions('Customer Care Center::read')
  getRatingByPeriod(@Body() filters: any) {
    return this.complaintStatisticsService.getRatingByPeriod(filters);
  }

} 