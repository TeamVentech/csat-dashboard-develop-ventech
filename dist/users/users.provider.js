"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersProvider = void 0;
const user_entity_1 = require("./entities/user.entity");
exports.UsersProvider = [
    {
        provide: 'USER_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(user_entity_1.User),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=users.provider.js.map