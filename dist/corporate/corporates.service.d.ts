import { Repository } from 'typeorm';
import { Corporate } from './entities/corporates.entity';
import { CreateCorporateDto } from './dto/create.dto';
import { UpdateCorporateDto } from './dto/update.dto';
export declare class CorporatesService {
    private readonly corporateRepository;
    constructor(corporateRepository: Repository<Corporate>);
    create(createCorporateDto: CreateCorporateDto): Promise<Corporate>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        categories: Corporate[];
        total: number;
    }>;
    findOne(id: string): Promise<Corporate>;
    update(id: string, updateCorporateDto: UpdateCorporateDto): Promise<Corporate>;
    remove(id: string): Promise<void>;
}
