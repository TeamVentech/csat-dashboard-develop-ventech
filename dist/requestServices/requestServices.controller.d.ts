import { RequestServicesService } from './requestServices.service';
import { UpdateRequestServicesDto } from './dto/update.dto';
export declare class RequestServicesController {
    private readonly requestServicesService;
    constructor(requestServicesService: RequestServicesService);
    create(createRequestServicesDto: any): Promise<import("./entities/requestServices.entity").RequestServices>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        data: import("./entities/requestServices.entity").RequestServices[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/requestServices.entity").RequestServices>;
    findType(type: string): Promise<import("./entities/requestServices.entity").RequestServices[]>;
    update(id: string, updateRequestServicesDto: UpdateRequestServicesDto): Promise<import("./entities/requestServices.entity").RequestServices>;
    rating(id: string, rate: any): Promise<import("./entities/requestServices.entity").RequestServices>;
    remove(id: string): Promise<void>;
}
