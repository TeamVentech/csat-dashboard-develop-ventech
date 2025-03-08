/* eslint-disable prettier/prettier */
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export const TypeOrmConfigCentrize: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST_CENTRIZE,
  port: 5432,
  username: process.env.DB_USER_CENTRIZE,
  password: process.env.DB_PASSWORD_CENTRIZE,
  database: process.env.DB_NAME_CENTRIZE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  // logging: true,
  extra: {
    ssl: {
      rejectUnauthorized: false, // This disables certificate validation
    },
  
  },

};

export const configurationCentrize = async () => {
  return {
    DATABASE_CONNECTION: {
      host: process.env.DB_HOST_CENTRIZE,
      port: 5432,
      username: process.env.DB_USER_CENTRIZE,
      password: process.env.DB_PASSWORD_CENTRIZE,
      database: process.env.DB_NAME_CENTRIZE,
      extra: {
        ssl: {
          rejectUnauthorized: false, // This disables certificate validation
        },
      
      },
    },
  };
};

