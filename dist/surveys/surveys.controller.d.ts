import { SurveysService } from './surveys.service';
export declare class SurveysController {
    private readonly surveysService;
    constructor(surveysService: SurveysService);
    create(createSurveysDto: any): Promise<import("./entities/Surveys.entity").Surveys[]>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        categories: import("./entities/Surveys.entity").Surveys[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/Surveys.entity").Surveys>;
    report(id: string, from: string, to: string, filter?: string): Promise<{
        date: any;
        value: number;
    }[]>;
    update(id: string, updateSurveysDto: any): Promise<import("./entities/Surveys.entity").Surveys>;
    remove(id: string): Promise<void>;
}
