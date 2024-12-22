"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubCategoryProvider = void 0;
const subcategories_entity_1 = require("./entities/subcategories.entity");
exports.SubCategoryProvider = [
    {
        provide: 'SUBCATEGORY_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(subcategories_entity_1.SubCategory),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=subcategory.provider.js.map