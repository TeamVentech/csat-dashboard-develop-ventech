"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintCategoryProviders = void 0;
const complaintCategory_entity_1 = require("./entities/complaintCategory.entity");
exports.complaintCategoryProviders = [
    {
        provide: 'COMPLAINT_CATEGORY_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(complaintCategory_entity_1.ComplaintCategory),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=complaintCategory.provider.js.map