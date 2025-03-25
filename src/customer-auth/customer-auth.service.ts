import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class CustomerAuthService {
  private otpStore: Map<string, { otp: string; timestamp: number }> = new Map();
  private readonly OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private customersService: CustomersService,
  ) {}

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(phoneNumber: string): Promise<{ message: string }> {
    // In a real application, you would integrate with an SMS service here
    // For now, we'll just store the OTP in memory
    const otp = this.generateOTP();
    this.otpStore.set(phoneNumber, {
      otp,
      timestamp: Date.now(),
    });

    // TODO: Integrate with actual SMS service
    console.log(`OTP for ${phoneNumber}: ${otp}`);
    await this.sendSms(otp,otp, phoneNumber)

    return { message: `OTP sent successfully : ${otp}` };
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<{ accessToken: string }> {
    const storedData = this.otpStore.get(phoneNumber);
    
    if (!storedData) {
      throw new BadRequestException('No OTP request found for this phone number');
    }

    if (Date.now() - storedData.timestamp > this.OTP_EXPIRY) {
      this.otpStore.delete(phoneNumber);
      throw new BadRequestException('OTP has expired');
    }

    if (storedData.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Clear the OTP after successful verification
    this.otpStore.delete(phoneNumber);

    // Find customer by phone number
    const customer = await this.customersService.doesEmailOrPhoneExist(undefined, phoneNumber);
    
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Generate JWT token with customer details
    const payload = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone_number: customer.phone_number,
      gender: customer.gender,
      age: customer.age,
      role: 'customer'
    };
    
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async sendSms(data: any, message: any, number: string) {
    const senderId = 'City Mall';
    const numbers = number
    const accName = 'CityMall';
    const accPass = 'G_PAXDujRvrw_KoD';

    const smsUrl = `https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS_General/SendSMS`;
    const response = await axios.get(smsUrl, {
      params: {
        senderid: senderId,
        numbers: numbers,
        accname: accName,
        AccPass: accPass,
        msg: encodeURIComponent(message)
      },
    });
  }
} 