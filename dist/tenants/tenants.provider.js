"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsProvider = void 0;
const tenants_entity_1 = require("./entities/tenants.entity");
exports.TenantsProvider = [
    {
        provide: 'TENANTS_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(tenants_entity_1.Tenant),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=tenants.provider.js.map