declare class AnswerDto {
    type: string;
    question: any;
    choices: string;
    answer: string | number | boolean;
}
export declare class CreateTransactionSurveyDto {
    state: string;
    addedBy: string;
    surveyId: string;
    touchPointId: string;
    customerId: string;
    categoryId: string;
    answers: AnswerDto[];
    rating: string;
}
export {};
