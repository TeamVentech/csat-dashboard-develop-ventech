import { Repository } from 'typeorm';
import { Touchpoint } from './entities/touchpoint.entity';
import { Category } from 'categories/entities/categories.entity';
export declare class TouchPointsService {
    private readonly touchPointRepository;
    private readonly categoryRepository;
    constructor(touchPointRepository: Repository<Touchpoint>, categoryRepository: Repository<Category>);
    create(createTouchPointDto: any): Promise<Touchpoint[]>;
    findAll(page: number, perPage: number, filterOptions: any): Promise<{
        categories: Touchpoint[];
        total: number;
    }>;
    findOne(id: string): Promise<Touchpoint>;
    findByCategory(id: string): Promise<Touchpoint[]>;
    getAll(): Promise<Touchpoint[]>;
    findAllCategory(): Promise<Touchpoint[]>;
    update(id: string, rating: string): Promise<void>;
    updaterochpoint(id: string, updateTouchPointDto: any): Promise<Touchpoint>;
    remove(id: string): Promise<void>;
    findHighestRated(): Promise<Touchpoint>;
    findLowestRated(): Promise<Touchpoint>;
}
