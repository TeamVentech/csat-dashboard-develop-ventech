import { ComplaintCategoryService } from './complaintCategory.service';
import { CreateComplaintCategoryDto } from './dto/create.dto';
import { UpdateComplaintCategoryDto } from './dto/update.dto';
export declare class CategoriesController {
    private readonly complaintCategoryService;
    constructor(complaintCategoryService: ComplaintCategoryService);
    create(createComplaintCategoryDto: CreateComplaintCategoryDto): Promise<import("./entities/complaintCategory.entity").ComplaintCategory>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        categories: import("./entities/complaintCategory.entity").ComplaintCategory[];
        total: number;
    }>;
    findAllComplaintCategory(): Promise<import("./entities/complaintCategory.entity").ComplaintCategory[]>;
    findOne(id: string): Promise<import("./entities/complaintCategory.entity").ComplaintCategory>;
    update(id: string, updateComplaintCategoryDto: UpdateComplaintCategoryDto): Promise<import("./entities/complaintCategory.entity").ComplaintCategory>;
    remove(id: string): Promise<void>;
}
