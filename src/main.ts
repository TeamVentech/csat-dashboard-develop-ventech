import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as moment from 'moment-timezone';
import { AwsParameterStore } from './config/aws-ssm.config';
import { DateUtil } from './utils/date.util';
import { TimestampInterceptor } from './interceptors/timestamp.interceptor';

dotenv.config();

async function bootstrap() {
  try {
    // Load parameters from AWS SSM Parameter Store if needed
    const env = process.env.NODE_ENV || 'development';
    if (process.env.LOAD_FROM_SSM === 'true') {
      const parameterStore = new AwsParameterStore();
      // Use path that matches your SSM parameter hierarchy, e.g., '/csat-dashboard/dev/'
      await parameterStore.fetchParametersAndCreateEnvFile(`/csat-dashboard/${env}/`);
    }
  
    // Set default timezone to Jordan/Amman
    moment.tz.setDefault('Asia/Amman');
    
    const serverTime = DateUtil.getCurrentTime();
    
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalInterceptors(new TimestampInterceptor());
    app.enableCors();
    const config = new DocumentBuilder()
      .setTitle('CSAT Dashboard API')
      .setDescription('The CSAT Dashboard API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const PORT = process.env.PORT || 3001
    await app.listen(PORT);
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}
bootstrap();
