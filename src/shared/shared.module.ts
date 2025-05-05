import { Module, Global } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Global()
@Module({
  providers: [
    {
      provide: 'DATA_SOURCE',
      useFactory: () => {
        // This will be provided by the database module 
        // We're just re-exporting it here
        return undefined;
      },
    },
  ],
  exports: ['DATA_SOURCE'],
})
export class SharedModule {} 