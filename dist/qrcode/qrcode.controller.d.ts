import { QRCodesService } from './qrcode.service';
import { UpdateQRCodeDto } from './dto/update.dto';
export declare class QRCodesController {
    private readonly qrcodesService;
    constructor(qrcodesService: QRCodesService);
    create(createQRCodeDto: any): Promise<any>;
    generateQRCode(createQRCodeDto: any): Promise<import("./entities/qrCodes.entity").QRCodes[] | {
        message: string;
    }>;
    findAll(page?: number, perPage?: number): Promise<{
        qrcodes: import("./entities/qrCodes.entity").QRCodes[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/qrCodes.entity").QRCodes>;
    update(id: string, updateQRCodeDto: UpdateQRCodeDto): Promise<import("./entities/qrCodes.entity").QRCodes>;
    remove(id: string): Promise<void>;
}
