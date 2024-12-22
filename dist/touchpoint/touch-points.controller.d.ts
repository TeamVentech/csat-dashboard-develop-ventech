import { TouchPointsService } from './touch-points.service';
import { UpdateTouchPointDto } from './dto/update.dto';
export declare class TouchPointsController {
    private readonly touchPointsService;
    constructor(touchPointsService: TouchPointsService);
    create(createTouchPointDto: any): Promise<import("./entities/touchpoint.entity").TouchPoint[]>;
    findAll(page?: number, perPage?: number, filter?: string): Promise<{
        categories: import("./entities/touchpoint.entity").TouchPoint[];
        total: number;
    }>;
    findAllCategory(): Promise<import("./entities/touchpoint.entity").TouchPoint[]>;
    findOne(id: string): Promise<import("./entities/touchpoint.entity").TouchPoint>;
    findHLRating(): Promise<import("./entities/touchpoint.entity").TouchPoint>;
    findLowestRated(): Promise<import("./entities/touchpoint.entity").TouchPoint>;
    update(id: string, updateTouchPointDto: UpdateTouchPointDto): Promise<import("./entities/touchpoint.entity").TouchPoint>;
    remove(id: string): Promise<void>;
}
