"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersProvider = void 0;
const customers_entity_1 = require("./entities/customers.entity");
exports.CustomersProvider = [
    {
        provide: 'CUSTOMERS_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(customers_entity_1.Customer),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=customers.provider.js.map