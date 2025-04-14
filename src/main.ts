import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as moment from 'moment-timezone';
import { AwsParameterStore } from './config/aws-ssm.config';

dotenv.config();

async function bootstrap() {
  try {
    // Load parameters from AWS SSM Parameter Store if needed
    const env = process.env.NODE_ENV || 'development';
    if (process.env.LOAD_FROM_SSM === 'true') {
      console.log('Loading parameters from AWS SSM...');
      const parameterStore = new AwsParameterStore();
      // Use path that matches your SSM parameter hierarchy, e.g., '/csat-dashboard/dev/'
      await parameterStore.fetchParametersAndCreateEnvFile(`/csat-dashboard/${env}/`);
      console.log('Parameters loaded successfully from AWS SSM');
    }
  
    // Set default timezone to Jordan/Amman
    moment.tz.setDefault('Asia/Amman');
    
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
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
    console.log(`Application is running on port ${PORT}`);
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}
bootstrap();
