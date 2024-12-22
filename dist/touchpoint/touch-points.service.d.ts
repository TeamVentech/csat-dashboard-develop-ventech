import { Repository } from 'typeorm';
import { TouchPoint } from './entities/touchpoint.entity';
import { Category } from 'categories/entities/categories.entity';
export declare class TouchPointsService {
    private readonly touchPointRepository;
    private readonly categoryRepository;
    constructor(touchPointRepository: Repository<TouchPoint>, categoryRepository: Repository<Category>);
    create(createTouchPointDto: any): Promise<TouchPoint[]>;
    findAll(page: number, perPage: number, filterOptions: any): Promise<{
        categories: TouchPoint[];
        total: number;
    }>;
    findOne(id: string): Promise<TouchPoint>;
    getAll(): Promise<TouchPoint[]>;
    findAllCategory(): Promise<TouchPoint[]>;
    update(id: string, rating: string): Promise<void>;
    updaterochpoint(id: string, updateTouchPointDto: any): Promise<TouchPoint>;
    remove(id: string): Promise<void>;
    findHighestRated(): Promise<TouchPoint>;
    findLowestRated(): Promise<TouchPoint>;
}
