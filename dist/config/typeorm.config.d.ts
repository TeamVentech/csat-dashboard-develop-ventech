import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export declare const TypeOrmConfigCentrize: TypeOrmModuleOptions;
export declare const configurationCentrize: () => Promise<{
    DATABASE_CONNECTION: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        pool: {
            max: number;
            min: number;
            idleTimeoutMillis: number;
        };
        extra: {
            ssl: {};
        };
    };
}>;
