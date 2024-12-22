import { DataSource } from 'typeorm';
import { QRCodes } from './entities/qrCodes.entity';
export declare const QrCodeProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<QRCodes>;
    inject: string[];
}[];
