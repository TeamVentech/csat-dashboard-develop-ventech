import { Repository } from 'typeorm';
import { SubCategory } from './entities/subcategories.entity';
import { CreateSubCategoryDto } from './dto/create.dto';
import { UpdateSubCategoryDto } from './dto/update.dto';
import { Category } from '../categories/entities/categories.entity';
export declare class SubCategoriesService {
    private readonly subCategoryRepository;
    private readonly categoryRepository;
    constructor(subCategoryRepository: Repository<SubCategory>, categoryRepository: Repository<Category>);
    create(createSubCategoryDto: CreateSubCategoryDto): Promise<SubCategory>;
    findAll(page: number, perPage: number, filterOptions: any): Promise<{
        categories: SubCategory[];
        total: number;
    }>;
    findOne(id: string): Promise<SubCategory>;
    getAll(): Promise<SubCategory[]>;
    update(id: string, updateSubCategoryDto: UpdateSubCategoryDto): Promise<SubCategory>;
    remove(id: string): Promise<void>;
}
