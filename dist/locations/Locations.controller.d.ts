import { LocationsService } from './Locations.service';
import { CreateLocationDto } from './dto/create.dto';
import { UpdateLocationDto } from './dto/update.dto';
export declare class LocationsController {
    private readonly LocationsService;
    constructor(LocationsService: LocationsService);
    create(createLocationDto: CreateLocationDto): Promise<import("./entities/Locations.entity").Location>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        categories: import("./entities/Locations.entity").Location[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/Locations.entity").Location>;
    findAllCategory(): Promise<import("./entities/Locations.entity").Location[]>;
    update(id: string, updateLocationDto: UpdateLocationDto): Promise<import("./entities/Locations.entity").Location>;
    remove(id: string): Promise<void>;
}
