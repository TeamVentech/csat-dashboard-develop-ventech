import { VouchersService } from './vouchers.service';
import { UpdateVouchersDto } from './dto/update.dto';
export declare class VouchersController {
    private readonly vouchersService;
    constructor(vouchersService: VouchersService);
    create(createVouchersDto: any): Promise<import("./entities/vouchers.entity").Vouchers>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        data: import("./entities/vouchers.entity").Vouchers[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/vouchers.entity").Vouchers>;
    importVouchers(data: any[]): Promise<{
        message: string;
    }>;
    update(id: string, updateVouchersDto: UpdateVouchersDto): Promise<import("./entities/vouchers.entity").Vouchers>;
    remove(id: string): Promise<void>;
}
