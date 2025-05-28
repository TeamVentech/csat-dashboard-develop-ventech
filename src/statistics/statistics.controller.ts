import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { DashboardStatisticsDto } from './dto/dashboard-statistics.dto';

@ApiTags('Statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns statistics for the dashboard',
    type: DashboardStatisticsDto,
  })
  async getDashboardStatistics(): Promise<DashboardStatisticsDto> {
    return this.statisticsService.getDashboardStatistics();
  }
} 