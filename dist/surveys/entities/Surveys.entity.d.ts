import { QRCodes } from '../../qrcode/entities/qrCodes.entity';
export declare class Surveys {
    id: string;
    name: string;
    type: string;
    state: string;
    metadata: any;
    brief: string;
    createdAt: Date;
    updatedAt: Date;
    survey: QRCodes[];
}
