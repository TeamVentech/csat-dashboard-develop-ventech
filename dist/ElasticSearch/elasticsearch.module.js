"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticSearchModule = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_1 = require("@nestjs/elasticsearch");
const elasticsearch_service_1 = require("./elasticsearch.service");
const database_module_1 = require("../database/database.module");
let ElasticSearchModule = class ElasticSearchModule {
};
exports.ElasticSearchModule = ElasticSearchModule;
exports.ElasticSearchModule = ElasticSearchModule = __decorate([
    (0, common_1.Module)({
        imports: [
            elasticsearch_1.ElasticsearchModule.register({
                node: 'https://f95c5ef83a9d4821ab25fab2ea1e060f.eastus2.azure.elastic-cloud.com:443',
                auth: {
                    username: 'elastic',
                    password: 'E5hE8xBSi3SU6ifAJ7FEkybe',
                },
            }),
            database_module_1.DatabaseModule
        ],
        exports: [elasticsearch_1.ElasticsearchModule, elasticsearch_service_1.ElasticService],
        providers: [elasticsearch_service_1.ElasticService]
    })
], ElasticSearchModule);
//# sourceMappingURL=elasticsearch.module.js.map