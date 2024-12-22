import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryDto } from './dto/create.dto';
import { UpdateSubCategoryDto } from './dto/update.dto';
export declare class SubCategoriesController {
    private readonly subCategoriesService;
    constructor(subCategoriesService: SubCategoriesService);
    create(createSubCategoryDto: CreateSubCategoryDto): Promise<import("./entities/subcategories.entity").SubCategory>;
    findAll(page?: number, perPage?: number, filter?: string): Promise<{
        categories: import("./entities/subcategories.entity").SubCategory[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/subcategories.entity").SubCategory>;
    GetAll(): Promise<import("./entities/subcategories.entity").SubCategory[]>;
    update(id: string, updateSubCategoryDto: UpdateSubCategoryDto): Promise<import("./entities/subcategories.entity").SubCategory>;
    remove(id: string): Promise<void>;
}
