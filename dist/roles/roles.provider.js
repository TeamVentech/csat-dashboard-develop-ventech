"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleProvider = void 0;
const roles_entity_1 = require("./entities/roles.entity");
exports.RoleProvider = [
    {
        provide: 'ROLE_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(roles_entity_1.Role),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=roles.provider.js.map