"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintsProvider = void 0;
const complaint_entity_1 = require("./entities/complaint.entity");
exports.ComplaintsProvider = [
    {
        provide: 'COMPLAINT_SERVICES_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(complaint_entity_1.Complaints),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=complaint.provider.js.map