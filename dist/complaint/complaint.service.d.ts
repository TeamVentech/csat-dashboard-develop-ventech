import { Repository } from 'typeorm';
import { Complaints } from './entities/complaint.entity';
import { CreateComplaintServicesDto } from './dto/create.dto';
import { UpdateComplaintServicesDto } from './dto/update.dto';
export declare class ComplaintsService {
    private readonly complaintsRepository;
    constructor(complaintsRepository: Repository<Complaints>);
    create(createComplaintsDto: CreateComplaintServicesDto): Promise<Complaints>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        data: Complaints[];
        total: number;
    }>;
    findOne(id: string): Promise<Complaints>;
    findType(type: string): Promise<Complaints[]>;
    update(id: string, updateComplaintsDto: UpdateComplaintServicesDto): Promise<Complaints>;
    remove(id: string): Promise<void>;
}
