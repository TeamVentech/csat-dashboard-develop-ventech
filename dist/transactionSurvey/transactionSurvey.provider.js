"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionSurveyProvider = void 0;
const transactionSurvey_entity_1 = require("./entities/transactionSurvey.entity");
const touchpoint_entity_1 = require("../touchpoint/entities/touchpoint.entity");
exports.TransactionSurveyProvider = [
    {
        provide: 'TRANSACTION_SURVEY_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(transactionSurvey_entity_1.TransactionSurvey),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'TOUCHPOINT_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(touchpoint_entity_1.TouchPoint),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=transactionSurvey.provider.js.map