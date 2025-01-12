import { ComplaintsService } from './complaint.service';
import { UpdateComplaintServicesDto } from './dto/update.dto';
export declare class ComplaintsController {
    private readonly complaintsService;
    constructor(complaintsService: ComplaintsService);
    create(CreateComplaintServicesDto: any): Promise<import("./entities/complaint.entity").Complaints>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        data: import("./entities/complaint.entity").Complaints[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/complaint.entity").Complaints>;
    findType(type: string): Promise<import("./entities/complaint.entity").Complaints[]>;
    update(id: string, UpdateComplaintServicesDto: UpdateComplaintServicesDto): Promise<import("./entities/complaint.entity").Complaints>;
    remove(id: string): Promise<void>;
}
