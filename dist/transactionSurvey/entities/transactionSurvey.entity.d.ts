import { Customer } from '../../customers/entities/customers.entity';
import { Surveys } from '../../surveys/entities/Surveys.entity';
export declare class TransactionSurvey {
    id: string;
    state: string;
    addedBy: string;
    createdAt: Date;
    updatedAt: Date;
    answers: Array<{
        type: string;
        question: Record<string, any>;
        choices: string;
        rate: string;
        answer: any;
    }>;
    rating: string;
    customerId: string;
    customer: Customer;
    surveyId: string;
    survey: Surveys;
    touchPointId: string;
    categoryId: string;
}
