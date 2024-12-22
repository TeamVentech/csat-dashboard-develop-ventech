"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseProviders = void 0;
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
exports.databaseProviders = [
    {
        provide: 'DATA_SOURCE',
        useFactory: async (configService) => {
            const options = {
                type: 'postgres',
                ...configService.get('DATABASE_CONNECTION'),
                synchronize: true,
                entities: [__dirname + '/../**/*.entity{.ts,.js}'],
                migrations: ['../../src/database/migrations/**/*.ts'],
                useUTC: true,
                logging: Boolean(process.env.PRINT_QUERIES),
            };
            const dataSource = new typeorm_1.DataSource(options);
            return dataSource.initialize();
        },
        inject: [config_1.ConfigService],
    },
];
//# sourceMappingURL=database.providers.js.map