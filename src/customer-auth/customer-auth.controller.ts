import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';

@Controller('customer-auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOTP(@Body('phoneNumber') phoneNumber: string) {
    return this.customerAuthService.sendOTP(phoneNumber);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOTP(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ) {
    return this.customerAuthService.verifyOTP(phoneNumber, otp);
  }
} 