import { CorporatesService } from './corporates.service';
import { CreateCorporateDto } from './dto/create.dto';
import { UpdateCorporateDto } from './dto/update.dto';
import { Corporate } from './entities/corporates.entity';
export declare class CorporatesController {
    private readonly corporatesService;
    constructor(corporatesService: CorporatesService);
    create(createCorporateDto: CreateCorporateDto): Promise<Corporate>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        categories: Corporate[];
        total: number;
    }>;
    find(name?: string): Promise<Corporate[]>;
    findOne(id: string): Promise<Corporate>;
    update(id: string, updatecorporateDto: UpdateCorporateDto): Promise<Corporate>;
    remove(id: string): Promise<void>;
}
