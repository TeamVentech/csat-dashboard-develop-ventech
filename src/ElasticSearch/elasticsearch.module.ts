import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticService } from './elasticsearch.service';
 
@Module({
  imports: [
    ConfigModule,
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: "https://search-csat-elastic-domain-pivjdjn2nbt7kbqhiwuhjgti2m.us-west-2.es.amazonaws.com",
        auth: {
          username: "admin",
          password: "Csat-dev-1234",
        }
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ElasticService],
  exports: [ElasticsearchModule, ElasticService]
})
export class ElasticSearchModule {}
// import { Module } from '@nestjs/common';
// import { ElasticsearchModule } from '@nestjs/elasticsearch';
// import { ElasticService } from './elasticsearch.service';
// import { DatabaseModule } from 'database/database.module';

// @Module({
//     imports: [
//         ElasticsearchModule.register({
//             node: 'https://search-csat-elastic-domain-pivjdjn2nbt7kbqhiwuhjgti2m.us-west-2.es.amazonaws.com', // Replace with your endpoint
//             auth: {
//                 username: 'admin',
//                 password: 'Csat-dev-1234',
//             },
//             headers: {
//                 'Content-Type': 'application/json',
//                 'x-elastic-client-meta': 'es=8.17.1,js=22.14.0,t=8.9.4,un=22.14.0', // example headers
//                 // Add any other headers here as necessary
//               },
            
        
//         }),
//         DatabaseModule
//     ],
//     exports: [ElasticsearchModule, ElasticService],
//     providers:[ElasticService]
// })
// export class ElasticSearchModule { }
