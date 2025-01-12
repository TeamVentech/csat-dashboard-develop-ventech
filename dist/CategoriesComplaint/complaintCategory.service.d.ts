import { Repository } from 'typeorm';
import { ComplaintCategory } from './entities/complaintCategory.entity';
import { CreateComplaintCategoryDto } from './dto/create.dto';
import { UpdateComplaintCategoryDto } from './dto/update.dto';
export declare class ComplaintCategoryService {
    private categoryRepository;
    constructor(categoryRepository: Repository<ComplaintCategory>);
    create(createComplaintCategoryDto: CreateComplaintCategoryDto): Promise<ComplaintCategory>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        categories: ComplaintCategory[];
        total: number;
    }>;
    findOne(id: string): Promise<ComplaintCategory>;
    findAllComplaintCategory(): Promise<ComplaintCategory[]>;
    update(id: string, updateComplaintCategoryDto: UpdateComplaintCategoryDto): Promise<ComplaintCategory>;
    remove(id: string): Promise<void>;
}
