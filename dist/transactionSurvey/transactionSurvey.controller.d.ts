import { TransactionSurveyService } from './transactionSurvey.service';
import { CreateTransactionSurveyDto } from './dto/create.dto';
import { UpdateTransactionSurveyDto } from './dto/update.dto';
export declare class TransactionSurveyController {
    private readonly transactionSurveyService;
    constructor(transactionSurveyService: TransactionSurveyService);
    create(createTransactionSurveyDto: CreateTransactionSurveyDto): Promise<import("./entities/transactionSurvey.entity").TransactionSurvey[]>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        categories: import("./entities/transactionSurvey.entity").TransactionSurvey[];
        total: number;
    }>;
    findAllState(surveyId: string, page: number, perPage: number, search?: string): Promise<{
        categories: import("./entities/transactionSurvey.entity").TransactionSurvey[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/transactionSurvey.entity").TransactionSurvey>;
    findOneServey(id: string): Promise<import("./entities/transactionSurvey.entity").TransactionSurvey[]>;
    update(id: string, updateTransactionSurveyDto: UpdateTransactionSurveyDto): Promise<import("./entities/transactionSurvey.entity").TransactionSurvey>;
    remove(id: string): Promise<void>;
    report(id: string, from: string, to: string, filter?: string, category?: string, touchpoint?: string): Promise<{
        date: any;
        value: number;
    }[]>;
    reportMostTouchPoint(id: string, filter?: string): void;
    getAverageTouchpointsForSurvey(): Promise<{
        most_touchpoints: any;
        least_touchpoints: any;
    }>;
    getAverageTouchpointsDate(from: string, to: string): Promise<{
        most_touchpoints: any;
    }>;
    getRatings(surveyId: string, categoryId: string, touchPointId: string): Promise<{
        question: any;
        averageRating: string;
    }[]>;
    getRatingsFilter(categoryId?: string, touchPointId?: string, customerAge?: string, customerGender?: string, fromDate?: Date, toDate?: Date): Promise<{
        avgRating: number;
        surveyCount: number;
    }>;
    getCustomerSurvey(cutomerId?: string): Promise<{
        results: any[];
    }>;
}
