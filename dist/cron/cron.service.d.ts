import { RequestServices } from '../requestServices/entities/requestServices.entity';
import { Repository } from 'typeorm';
export declare class CronService {
    private readonly requestServicesRepo;
    constructor(requestServicesRepo: Repository<RequestServices>);
    handleDailyJob(): Promise<void>;
}
