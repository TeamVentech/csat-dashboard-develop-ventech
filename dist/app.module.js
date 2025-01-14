"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_1 = require("@nestjs/config");
const typeorm_config_1 = require("./config/typeorm.config");
const typeorm_1 = require("@nestjs/typeorm");
const categories_module_1 = require("./categories/categories.module");
const sub_categories_module_1 = require("./sub-categories/sub-categories.module");
const departments_module_1 = require("./departments/departments.module");
const Locations_module_1 = require("./locations/Locations.module");
const roles_module_1 = require("./roles/roles.module");
const users_module_1 = require("./users/users.module");
const customers_module_1 = require("./customers/customers.module");
const corporates_module_1 = require("./corporate/corporates.module");
const qrcode_module_1 = require("./qrcode/qrcode.module");
const touch_points_module_1 = require("./touchpoint/touch-points.module");
const platform_express_1 = require("@nestjs/platform-express");
const auth_module_1 = require("./auth/auth.module");
const Sections_module_1 = require("./section/Sections.module");
const surveys_module_1 = require("./surveys/surveys.module");
const transactionSurvey_module_1 = require("./transactionSurvey/transactionSurvey.module");
const requestServices_module_1 = require("./requestServices/requestServices.module");
const complaint_module_1 = require("./complaint/complaint.module");
const comment_module_1 = require("./comment/comment.module");
const tenants_module_1 = require("./tenants/tenants.module");
const vouchers_module_1 = require("./vochers/vouchers.module");
const cron_service_1 = require("./cron/cron.service");
const schedule_1 = require("@nestjs/schedule");
const requestServices_entity_1 = require("./requestServices/entities/requestServices.entity");
const elasticsearch_module_1 = require("./ElasticSearch/elasticsearch.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [typeorm_config_1.configurationCentrize],
                envFilePath: '.env',
            }),
            platform_express_1.MulterModule.register({
                dest: './uploads',
            }),
            typeorm_1.TypeOrmModule.forRoot(typeorm_config_1.TypeOrmConfigCentrize),
            categories_module_1.CategoriesModule,
            sub_categories_module_1.SubCategoriesModule,
            departments_module_1.DepartmentsModule,
            roles_module_1.RolesModule,
            users_module_1.UsersModule,
            customers_module_1.CustomersModule,
            corporates_module_1.CorporatesModule,
            auth_module_1.AuthModule,
            qrcode_module_1.QrcodeModule,
            touch_points_module_1.TouchPointsModule,
            surveys_module_1.SurveysModule,
            Locations_module_1.LocationsModule,
            Sections_module_1.SectionsModule,
            transactionSurvey_module_1.TransactionSurveyModule,
            requestServices_module_1.RequestServicesModule,
            complaint_module_1.ComplaintsModule,
            comment_module_1.CommentModule,
            tenants_module_1.TenantsModule,
            vouchers_module_1.VouchersModule,
            elasticsearch_module_1.ElasticSearchModule,
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forFeature([requestServices_entity_1.RequestServices]),
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, cron_service_1.CronService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map