import { Category } from 'categories/entities/categories.entity';
import { Customer } from 'customers/entities/customers.entity';
import { Surveys } from 'surveys/entities/Surveys.entity';
export declare class Comment {
    id: string;
    message: String;
    type: String;
    metadata: any;
    customerId: string;
    customer: Customer;
    categoryId: string;
    category: Category;
    touchpointId: string | null;
    touchpointName: any;
    surveyId: string;
    survey: Surveys;
    status: string;
    submissionDate: Date;
    updatedAt: Date;
    createdAt: Date;
}
