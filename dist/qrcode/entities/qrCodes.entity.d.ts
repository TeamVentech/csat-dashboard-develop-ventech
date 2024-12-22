import { Surveys } from '../../surveys/entities/Surveys.entity';
export declare class QRCodes {
    id: string;
    qr_code_identifier: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
    survey: Surveys;
    surveyId: string;
}
