import { SectionsService } from './Sections.service';
import { CreateSectionDto } from './dto/create.dto';
import { UpdateSectionDto } from './dto/update.dto';
export declare class SectionsController {
    private readonly sectionsService;
    constructor(sectionsService: SectionsService);
    create(createSectionDto: CreateSectionDto): Promise<import("./entities/Sections.entity").Section>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        categories: import("./entities/Sections.entity").Section[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/Sections.entity").Section>;
    findallwithoutfilter(): Promise<import("./entities/Sections.entity").Section[]>;
    findAllCategory(): Promise<import("./entities/Sections.entity").Section[]>;
    update(id: string, updateSectionDto: UpdateSectionDto): Promise<import("./entities/Sections.entity").Section>;
    remove(id: string): Promise<void>;
}
