"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationProvider = void 0;
const Locations_entity_1 = require("./entities/Locations.entity");
exports.LocationProvider = [
    {
        provide: 'LOCATIONS_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(Locations_entity_1.Location),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=Locations.provider.js.map