import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticService } from './elasticsearch.service';
import { DatabaseModule } from 'database/database.module';

@Module({
    imports: [
        ElasticsearchModule.register({
            node: 'https://3d4f936d5cbd4ac88903dff57bb8f34b.eastus2.azure.elastic-cloud.com:443', // Replace with your endpoint
            auth: {
                username: 'elastic',
                password: 'J85UENG9WZ8jxvc2lRAyT11r',
            },
        }),
        DatabaseModule
    ],
    exports: [ElasticsearchModule, ElasticService],
    providers:[ElasticService]
})
export class ElasticSearchModule { }
