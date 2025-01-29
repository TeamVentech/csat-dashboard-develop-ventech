import { ServicesService } from './services.service';
import { UpdateServicesDto } from './dto/update.dto';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    create(createServicesDto: any): Promise<import("./entities/services.entity").Services>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        data: import("./entities/services.entity").Services[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/services.entity").Services>;
    findType(type: string): Promise<{
        AVAILABLE: number;
        UNAVAILABLE: number;
        OCCUPIED: number;
    }>;
    findOneByTypeStatus(type: string, status: string): Promise<import("./entities/services.entity").Services>;
    update(id: string, updateServicesDto: UpdateServicesDto): Promise<import("./entities/services.entity").Services>;
    remove(id: string): Promise<void>;
}
