"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrCodeProvider = void 0;
const qrCodes_entity_1 = require("./entities/qrCodes.entity");
exports.QrCodeProvider = [
    {
        provide: 'QRCODE_REPOSITORY',
        useFactory: (dataSource) => dataSource.getRepository(qrCodes_entity_1.QRCodes),
        inject: ['DATA_SOURCE'],
    },
];
//# sourceMappingURL=qrcode.provider.js.map