import {
  Controller, Post, Body, UseGuards, UseInterceptors, ClassSerializerInterceptor
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorator/permissions.decorator';
import { TransformInterceptor } from '../../interceptors/transform.interceptor';
import { GiftVoucherStatisticsService } from '../services/gift-voucher-statistics.service';
import { GiftVoucherChartDto } from '../dto/gift-voucher-chart.dto';
import { GiftVoucherCorporateSpendersDto } from '../dto/gift-voucher-corporate-spenders.dto';
import { GiftVoucherOccasionsDto } from '../dto/gift-voucher-occasions.dto';
import { RatingByPeriodDto } from 'requestServices/dto/rating-by-period.dto';
import { RatingStatisticsDto } from 'requestServices/dto/rating-statistics.dto';
import { GiftVoucherPaymentMethodsDto } from '../dto/gift-voucher-payment-methods.dto';
import { GiftVoucherExtensionsDto } from '../dto/gift-voucher-extensions.dto';
import { GiftVoucherDurationAfterExpiryDto } from '../dto/gift-voucher-duration-after-expiry.dto';

@Controller('gift-voucher-statistics')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class GiftVoucherStatisticsController {
  constructor(private readonly giftVoucherStatisticsService: GiftVoucherStatisticsService) {}

  @Post('by-denomination')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getVoucherSalesByDenomination(@Body() filters: GiftVoucherChartDto) {
    return this.giftVoucherStatisticsService.getVoucherSalesByDenomination(filters);
  }

  @Post('corporate-spenders')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getCorporateHighestSpenders(@Body() filters: GiftVoucherCorporateSpendersDto) {
    return this.giftVoucherStatisticsService.getCorporateHighestSpenders(filters);
  }

  @Post('common-occasions')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getCommonOccasions(@Body() filters: GiftVoucherOccasionsDto) {
    return this.giftVoucherStatisticsService.getCommonOccasions(filters);
  }

  @Post('rating-statistics')
  @Permissions('Customer Care Center::read')
  getRatingStatistics(@Body() filters: RatingStatisticsDto) {
    return this.giftVoucherStatisticsService.getRatingStatistics(filters);
  }

  @Post('rating-by-period')
  @Permissions('Customer Care Center::read')
  getRatingByPeriod(@Body() filters: RatingByPeriodDto) {
    return this.giftVoucherStatisticsService.getRatingByPeriod(filters);
  }

  @Post('payment-methods')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getPaymentMethodStatistics(@Body() filters: GiftVoucherPaymentMethodsDto) {
    return this.giftVoucherStatisticsService.getPaymentMethodStatistics(filters);
  }

  @Post('extensions')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getVoucherExtensionsStatistics(@Body() filters: GiftVoucherExtensionsDto) {
    return this.giftVoucherStatisticsService.getVoucherExtensionsStatistics(filters);
  }

  @Post('refunded-vouchers')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getRefundedVouchersStatistics(@Body() filters: GiftVoucherExtensionsDto) {
    return this.giftVoucherStatisticsService.getRefundedVouchersStatistics(filters);
  }

  @Post('duration-after-expiry')
  @Permissions('Customer Care Center::read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  getDurationAfterExpiry(@Body() filters: GiftVoucherDurationAfterExpiryDto) {
    return this.giftVoucherStatisticsService.getDurationAfterExpiry(filters);
  }
} 