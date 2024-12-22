import { Repository } from 'typeorm';
import { Location } from './entities/Locations.entity';
import { CreateLocationDto } from './dto/create.dto';
import { UpdateLocationDto } from './dto/update.dto';
export declare class LocationsService {
    private readonly LocationRepository;
    constructor(LocationRepository: Repository<Location>);
    create(createLocationDto: CreateLocationDto): Promise<Location>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        categories: Location[];
        total: number;
    }>;
    findOne(id: string): Promise<Location>;
    update(id: string, updateLocationDto: UpdateLocationDto): Promise<Location>;
    findAllLocation(): Promise<Location[]>;
    remove(id: string): Promise<void>;
}
