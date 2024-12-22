"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionProvider = void 0;
const Sections_entity_1 = require("./entities/Sections.entity");
exports.SectionProvider = [
    {
        provide: 'SECTIONS_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(Sections_entity_1.Section),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=Sections.provider.js.map