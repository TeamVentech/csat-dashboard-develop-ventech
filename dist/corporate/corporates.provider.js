"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorporatesProvider = void 0;
const corporates_entity_1 = require("./entities/corporates.entity");
exports.CorporatesProvider = [
    {
        provide: 'CORPORTES_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(corporates_entity_1.Corporate),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=corporates.provider.js.map