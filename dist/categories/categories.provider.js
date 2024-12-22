"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryProviders = void 0;
const categories_entity_1 = require("./entities/categories.entity");
exports.categoryProviders = [
    {
        provide: 'CATEGORY_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(categories_entity_1.Category),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=categories.provider.js.map