"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveysProvider = void 0;
const Surveys_entity_1 = require("./entities/Surveys.entity");
exports.SurveysProvider = [
    {
        provide: 'SURVEYS_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(Surveys_entity_1.Surveys),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=surveys.provider.js.map