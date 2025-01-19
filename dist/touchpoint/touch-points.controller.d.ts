import { TouchPointsService } from './touch-points.service';
import { UpdateTouchPointDto } from './dto/update.dto';
export declare class TouchPointsController {
    private readonly touchPointsService;
    constructor(touchPointsService: TouchPointsService);
    create(createTouchPointDto: any): Promise<import("./entities/touchpoint.entity").Touchpoint[]>;
    findAll(page?: number, perPage?: number, filter?: string): Promise<{
        categories: import("./entities/touchpoint.entity").Touchpoint[];
        total: number;
    }>;
    findAllSearch(page?: number, perPage?: number, filter?: string, type?: string): Promise<{
        categories: import("./entities/touchpoint.entity").Touchpoint[];
        total: number;
    }>;
    findAllCategory(): Promise<import("./entities/touchpoint.entity").Touchpoint[]>;
    findOne(id: string): Promise<import("./entities/touchpoint.entity").Touchpoint>;
    findByCategory(id: string): Promise<import("./entities/touchpoint.entity").Touchpoint[]>;
    findHLRating(): Promise<import("./entities/touchpoint.entity").Touchpoint>;
    findLowestRated(): Promise<import("./entities/touchpoint.entity").Touchpoint>;
    update(id: string, updateTouchPointDto: UpdateTouchPointDto): Promise<import("./entities/touchpoint.entity").Touchpoint>;
    remove(id: string): Promise<void>;
}
