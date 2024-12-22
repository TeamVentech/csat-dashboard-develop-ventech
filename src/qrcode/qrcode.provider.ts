import { DataSource } from 'typeorm';
import { QRCodes } from './entities/qrCodes.entity';

export const QrCodeProvider = [
  {
    provide: 'QRCODE_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(QRCodes),
    inject: ['DATA_SOURCE'],
  },
];
