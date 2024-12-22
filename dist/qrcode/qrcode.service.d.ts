import { Repository } from 'typeorm';
import { QRCodes } from './entities/qrCodes.entity';
import { UpdateQRCodeDto } from './dto/update.dto';
export declare class QRCodesService {
    private readonly qrCodeRepository;
    constructor(qrCodeRepository: Repository<QRCodes>);
    create(createQRCodeDto: any): Promise<any>;
    findAll(page?: number, perPage?: number): Promise<{
        qrcodes: QRCodes[];
        total: number;
    }>;
    findOne(id: string): Promise<QRCodes>;
    update(id: string, updateQRCodeDto: UpdateQRCodeDto): Promise<QRCodes>;
    remove(id: string): Promise<void>;
    generateAndSaveQRCode(createQRCodeDto: any): Promise<QRCodes[] | {
        message: string;
    }>;
}
