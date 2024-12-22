import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async (configService: ConfigService) => {
      const options: PostgresConnectionOptions = {
        type: 'postgres',
        ...configService.get('DATABASE_CONNECTION'),
        synchronize: true,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: ['../../src/database/migrations/**/*.ts'],
        useUTC: true,
        logging: Boolean(process.env.PRINT_QUERIES), // to print sql queries on console
      };
      const dataSource = new DataSource(options);
      return dataSource.initialize();
    },
    inject: [ConfigService],
  },
];
