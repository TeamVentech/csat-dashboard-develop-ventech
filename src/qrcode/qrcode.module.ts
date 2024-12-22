import { Module } from '@nestjs/common';
import { QRCodesController } from './qrcode.controller';
import { QRCodesService } from './qrcode.service';
import { QrCodeProvider } from './qrcode.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [QRCodesController],
  providers: [QRCodesService, ...QrCodeProvider]
})
export class QrcodeModule {}
