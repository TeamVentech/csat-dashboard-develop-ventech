import { ApiProperty } from '@nestjs/swagger';

export class LostChildStatisticsDto {
  @ApiProperty({ description: 'Count of active (Open) lost child cases' })
  openCasesCount: number;

  @ApiProperty({ description: 'Count of active (Child Found) cases' })
  childFoundCasesCount: number;
}

export class IncidentStatisticsDto {
  @ApiProperty({ description: 'Count of open incident cases' })
  openCasesCount: number;

  @ApiProperty({ description: 'Count of cases with Pending Internal status' })
  pendingInternalCasesCount: number;
}

export class LostFoundStatisticsDto {
  @ApiProperty({ description: 'Count of open cases not in Article Found or Article Not Found status' })
  openCasesCount: number;

  @ApiProperty({ description: 'Count of cases that are in progress' })
  inProgressCasesCount: number;
}

export class ServicesStatisticsDto {
  @ApiProperty({ description: 'Count of delivery requests across all service types' })
  deliveryRequestsCount: number;

  @ApiProperty({ description: 'Count of pickup requests' })
  pickupRequestsCount: number;
}

export class VoucherStatisticsDto {
  @ApiProperty({ description: 'Count of in-stock vouchers' })
  inStockCount: number;

  @ApiProperty({ description: 'Count of vouchers sold today' })
  soldTodayCount: number;
}

export class FeedbackStatisticsDto {
  @ApiProperty({ description: 'Count of comments with Open status' })
  openCommentsCount: number;

  @ApiProperty({ description: 'Count of suggestions with Pending Internal status' })
  pendingSuggestionsCount: number;

  @ApiProperty({ description: 'Total count of complaints with Open and Pending (CX Team) status' })
  openPendingComplaintsCount: number;
}

export class DashboardStatisticsDto {
  @ApiProperty({ type: LostChildStatisticsDto })
  lostChildStats: LostChildStatisticsDto;

  @ApiProperty({ type: IncidentStatisticsDto })
  incidentStats: IncidentStatisticsDto;

  @ApiProperty({ type: LostFoundStatisticsDto })
  lostFoundStats: LostFoundStatisticsDto;

  @ApiProperty({ type: ServicesStatisticsDto })
  servicesStats: ServicesStatisticsDto;

  @ApiProperty({ type: VoucherStatisticsDto })
  voucherStats: VoucherStatisticsDto;

  @ApiProperty({ type: FeedbackStatisticsDto })
  feedbackStats: FeedbackStatisticsDto;
} 