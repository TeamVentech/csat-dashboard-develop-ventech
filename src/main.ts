import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as moment from 'moment-timezone';

dotenv.config();

async function bootstrap() {
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
  await app.listen( PORT);
}
bootstrap();
