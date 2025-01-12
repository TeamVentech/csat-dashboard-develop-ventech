"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VouchersProvider = void 0;
const vouchers_entity_1 = require("./entities/vouchers.entity");
exports.VouchersProvider = [
    {
        provide: 'VOUCHERS_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(vouchers_entity_1.Vouchers),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=vouchers.provider.js.map