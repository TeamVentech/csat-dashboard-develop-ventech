"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestServicesProvider = void 0;
const requestServices_entity_1 = require("./entities/requestServices.entity");
exports.RequestServicesProvider = [
    {
        provide: 'REQUEST_SERVICES_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(requestServices_entity_1.RequestServices),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=requestServices.provider.js.map