import { Repository } from 'typeorm';
import { Section } from './entities/Sections.entity';
import { CreateSectionDto } from './dto/create.dto';
import { UpdateSectionDto } from './dto/update.dto';
import { Role } from 'roles/entities/roles.entity';
export declare class SectionsService {
    private readonly sectionRepository;
    private readonly roleRepository;
    constructor(sectionRepository: Repository<Section>, roleRepository: Repository<Role>);
    create(createSectionDto: CreateSectionDto): Promise<Section>;
    findAllSections(): Promise<Section[]>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        categories: Section[];
        total: number;
    }>;
    findOne(id: string): Promise<Section>;
    findallwithoutfilter(): Promise<Section[]>;
    update(id: string, updateSectionDto: UpdateSectionDto): Promise<Section>;
    remove(id: string): Promise<void>;
}
