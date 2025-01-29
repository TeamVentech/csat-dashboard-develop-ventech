"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesProvider = void 0;
const services_entity_1 = require("./entities/services.entity");
exports.ServicesProvider = [
    {
        provide: 'SERVICES_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(services_entity_1.Services),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=services.provider.js.map