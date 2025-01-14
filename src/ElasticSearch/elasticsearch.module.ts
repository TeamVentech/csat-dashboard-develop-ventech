import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticService } from './elasticsearch.service';
import { DatabaseModule } from 'database/database.module';

@Module({
    imports: [
        ElasticsearchModule.register({
            node: 'https://f95c5ef83a9d4821ab25fab2ea1e060f.eastus2.azure.elastic-cloud.com:443', // Replace with your endpoint
            auth: {
                username: 'elastic',
                password: 'E5hE8xBSi3SU6ifAJ7FEkybe',
            },
        }),
        DatabaseModule
    ],
    exports: [ElasticsearchModule, ElasticService],
    providers:[ElasticService]
})
export class ElasticSearchModule { }
