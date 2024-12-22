"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentProvider = void 0;
const departments_entity_1 = require("./entities/departments.entity");
exports.DepartmentProvider = [
    {
        provide: 'DEPARTMENT_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(departments_entity_1.Department),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=departments.provider.js.map