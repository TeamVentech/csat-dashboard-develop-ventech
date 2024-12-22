import { Repository } from 'typeorm';
import { Surveys } from './entities/Surveys.entity';
export declare class SurveysService {
    private readonly SurveysRepository;
    constructor(SurveysRepository: Repository<Surveys>);
    create(createSurveysDto: any): Promise<Surveys[]>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        categories: Surveys[];
        total: number;
    }>;
    findOne(id: string): Promise<Surveys>;
    reportData(id: string, from: string, to: string, filter: string): Promise<{
        date: any;
        value: number;
    }[]>;
    update(id: string, updateSurveysDto: any): Promise<Surveys>;
    remove(id: string): Promise<void>;
}
