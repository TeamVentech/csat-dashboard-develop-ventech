"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TouchPointProvider = void 0;
const touchpoint_entity_1 = require("./entities/touchpoint.entity");
exports.TouchPointProvider = [
    {
        provide: 'TOUCHPOINT_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(touchpoint_entity_1.TouchPoint),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=touchPoint.provider.js.map