"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationCentrize = exports.TypeOrmConfigCentrize = void 0;
const dotenv = require("dotenv");
dotenv.config();
exports.TypeOrmConfigCentrize = {
    type: 'postgres',
    host: process.env.DB_HOST_CENTRIZE,
    port: 5432,
    username: process.env.DB_USER_CENTRIZE,
    password: process.env.DB_PASSWORD_CENTRIZE,
    database: process.env.DB_NAME_CENTRIZE,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    extra: {
        ssl: {},
    },
};
const configurationCentrize = async () => {
    return {
        DATABASE_CONNECTION: {
            host: process.env.DB_HOST_CENTRIZE,
            port: 5432,
            username: process.env.DB_USER_CENTRIZE,
            password: process.env.DB_PASSWORD_CENTRIZE,
            database: process.env.DB_NAME_CENTRIZE,
            pool: {
                max: 10,
                min: 2,
                idleTimeoutMillis: 30000,
            },
            extra: {
                ssl: {},
            },
        },
    };
};
exports.configurationCentrize = configurationCentrize;
//# sourceMappingURL=typeorm.config.js.map