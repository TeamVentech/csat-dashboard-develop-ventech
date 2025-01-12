import { Repository } from 'typeorm';
import { Vouchers } from './entities/vouchers.entity';
import { CreateVouchersDto } from './dto/create.dto';
import { UpdateVouchersDto } from './dto/update.dto';
export declare class VouchersService {
    private readonly vouchersRepository;
    constructor(vouchersRepository: Repository<Vouchers>);
    create(createVouchersDto: CreateVouchersDto): Promise<Vouchers>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        data: Vouchers[];
        total: number;
    }>;
    findOne(id: string): Promise<Vouchers>;
    importVouchers(data: any[]): Promise<void>;
    update(id: string, updateVouchersDto: UpdateVouchersDto): Promise<Vouchers>;
    remove(id: string): Promise<void>;
}
