"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentProvider = void 0;
const comment_entity_1 = require("./entities/comment.entity");
exports.CommentProvider = [
    {
        provide: 'COMMENT_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(comment_entity_1.Comment),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=comment.provider.js.map