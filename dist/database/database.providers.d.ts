import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
export declare const databaseProviders: {
    provide: string;
    useFactory: (configService: ConfigService) => Promise<DataSource>;
    inject: (typeof ConfigService)[];
}[];
