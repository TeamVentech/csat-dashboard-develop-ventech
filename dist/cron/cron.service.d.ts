import { RequestServices } from '../requestServices/entities/requestServices.entity';
import { Repository } from 'typeorm';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
export declare class CronService {
    private readonly requestServicesRepo;
    private readonly elasticService;
    constructor(requestServicesRepo: Repository<RequestServices>, elasticService: ElasticService);
    handleDailyJobs(): Promise<void>;
    handleDailyJob(): Promise<void>;
}
