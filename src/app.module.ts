import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import {
  TypeOrmConfigCentrize,
  configurationCentrize,
} from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from './categories/categories.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
// import { DepartmentsService } from './departments/departments.service';
import { DepartmentsModule } from './departments/departments.module';
import { LocationsModule } from './locations/Locations.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { CorporatesModule } from './corporate/corporates.module';
import { QrcodeModule } from './qrcode/qrcode.module';
import { TouchPointsModule } from './touchpoint/touch-points.module';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from './auth/auth.module';
import { SectionsModule } from './section/Sections.module';
import { SurveysModule } from './surveys/surveys.module';
import { TransactionSurveyModule } from './transactionSurvey/transactionSurvey.module';
import { RequestServicesModule } from './requestServices/requestServices.module';
import { ComplaintsModule } from './complaint/complaint.module';
import { CommentModule } from 'comment/comment.module';
import { TenantsModule } from 'tenants/tenants.module';
import { VouchersModule } from 'vochers/vouchers.module';
import { CronService } from 'cron/cron.service'; // Adjust the path if needed
import { ScheduleModule } from '@nestjs/schedule';
import { RequestServices } from 'requestServices/entities/requestServices.entity';
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module';
import { ServicesModule } from 'service/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configurationCentrize],
      envFilePath: '.env',
    }),
    MulterModule.register({
      dest: './uploads', // specify the upload directory
    }),
    TypeOrmModule.forRoot(TypeOrmConfigCentrize),
    CategoriesModule,
    SubCategoriesModule,
    DepartmentsModule,
    RolesModule,
    UsersModule,
    CustomersModule,
    CorporatesModule,
    AuthModule,
    QrcodeModule,
    TouchPointsModule,
    SurveysModule,
    LocationsModule,
    SectionsModule,
    TransactionSurveyModule,
    RequestServicesModule,
    ComplaintsModule,
    CommentModule,
    TenantsModule,
    VouchersModule,
    ElasticSearchModule,
    ServicesModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([RequestServices]), 
  ],
  controllers: [AppController],
  providers: [AppService, CronService],
})
export class AppModule {}
