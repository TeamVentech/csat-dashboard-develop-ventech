import { Controller, Post, Body, UseGuards, UseInterceptors, ClassSerializerInterceptor, HttpException, HttpStatus } from '@nestjs/common';
import { TransactionReportService } from '../services/transaction-report.service';
import { PeriodType, TransactionReportDto } from '../dto/transaction-report.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { TransformInterceptor } from '../../interceptors/transform.interceptor';

@Controller('survey-transaction-report')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class TransactionReportController {
  constructor(private readonly transactionReportService: TransactionReportService) {}

  @Post('chart')
  async getTransactionReportChart(@Body() filters: TransactionReportDto) {
    try {
      
      const result = await this.transactionReportService.getTransactionReport(filters);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error processing transaction report:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Error processing transaction report',
          error: error.message
        }, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('ratings')
  async getRatingsReport(@Body() filters: TransactionReportDto) {
    try {
      
      const result = await this.transactionReportService.getRatingsReport(filters);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error processing ratings report:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Error processing ratings report',
          error: error.message
        }, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('touchpoints')
  async getMostCommonTouchpoints(@Body() filters: TransactionReportDto) {
    try {
      
      const result = await this.transactionReportService.getMostCommonTouchpoints(filters);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error processing touchpoints report:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Error processing touchpoints report',
          error: error.message
        }, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('touchpoint-ratings')
  async getTouchpointRatings(@Body() filters: TransactionReportDto) {
    try {
      
      const result = await this.transactionReportService.getTouchpointRatings(filters);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error processing touchpoint ratings report:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Error processing touchpoint ratings report',
          error: error.message
        }, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('question-ratings')
  async getQuestionRatings(@Body() filters: TransactionReportDto) {
    try {
      
      const result = await this.transactionReportService.getQuestionRatings(filters);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error processing question ratings report:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Error processing question ratings report',
          error: error.message
        }, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

} 