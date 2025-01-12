import { Repository } from 'typeorm';
import { Category } from './entities/categories.entity';
import { CreateCategoryDto } from './dto/create.dto';
import { UpdateCategoryDto } from './dto/update.dto';
export declare class CategoriesService {
    private categoryRepository;
    constructor(categoryRepository: Repository<Category>);
    create(createCategoryDto: CreateCategoryDto): Promise<Category>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        categories: Category[];
        total: number;
    }>;
    findOne(id: string): Promise<Category>;
    findByType(type: string): Promise<Category[]>;
    findAllCategory(): Promise<Category[]>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category>;
    remove(id: string): Promise<void>;
}
