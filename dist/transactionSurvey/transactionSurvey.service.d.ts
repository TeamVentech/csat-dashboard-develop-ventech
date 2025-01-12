import { DataSource, Repository } from 'typeorm';
import { TransactionSurvey } from './entities/transactionSurvey.entity';
import { Touchpoint } from '../touchpoint/entities/touchpoint.entity';
import { TouchPointsService } from 'touchpoint/touch-points.service';
export declare class TransactionSurveyService {
    private readonly transactionSurveyRepository;
    private readonly touchPointRepository;
    private readonly dataSource;
    private readonly touchPointsService;
    constructor(transactionSurveyRepository: Repository<TransactionSurvey>, touchPointRepository: Repository<Touchpoint>, dataSource: DataSource, touchPointsService: TouchPointsService);
    create(createTransactionSurveyDto: any): Promise<TransactionSurvey[]>;
    findAlls(): Promise<TransactionSurvey[]>;
    findAll(page: number, perPage: number, filterOptions: any): Promise<{
        categories: TransactionSurvey[];
        total: number;
    }>;
    findAllState(page: number, perPage: number, filterOptions: any, surveyId: string): Promise<{
        categories: TransactionSurvey[];
        total: number;
    }>;
    findOne(id: string): Promise<TransactionSurvey>;
    update(id: string, updateTransactionSurveyDto: any): Promise<TransactionSurvey>;
    remove(id: string): Promise<void>;
    reportData(id: string, from: string, to: string, filter: string, category: string, touchpoint: string): Promise<{
        date: any;
        value: number;
    }[]>;
    getAverageTouchpointsForSurvey(): Promise<{
        most_touchpoints: any;
        least_touchpoints: any;
    }>;
    getAverageTouchpointsDate(fromDate: string, toDate: string): Promise<{
        most_touchpoints: any;
    }>;
    findOneServey(id: string): Promise<TransactionSurvey[]>;
    getRatingsBySurveyCategoryAndTouchPoint(surveyId: string, categoryId: string, touchpointId: string): Promise<{
        question: any;
        averageRating: string;
    }[]>;
    getRatings(filterOptions: {
        categoryId?: string;
        touchPointId?: string;
        customerAge?: string;
        customerGender?: string;
        dateRange?: {
            from: Date;
            to: Date;
        };
    }): Promise<{
        avgRating: number;
        surveyCount: number;
    }>;
    getCustomerSurvey(filterOptions: {
        cutomerId?: string;
    }): Promise<{
        results: any[];
    }>;
}
