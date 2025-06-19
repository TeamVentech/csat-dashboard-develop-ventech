import { Module } from '@nestjs/common'
import { VouchersController } from './vouchers.controller'
import { VouchersService } from './vouchers.service'
import { Vouchers } from './entities/vouchers.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DatabaseModule } from 'database/database.module'
import { RolesModule } from 'roles/roles.module'
import { ElasticSearchModule } from 'ElasticSearch/elasticsearch.module'
import { RequestServices } from 'requestServices/entities/requestServices.entity'
import { SmsModule } from 'sms/sms.module'

@Module({
	imports: [
		DatabaseModule,
		TypeOrmModule.forFeature([Vouchers, RequestServices]),
		RolesModule,
		ElasticSearchModule,
		SmsModule,
	],
	controllers: [VouchersController],
	providers: [
		{
			provide: 'VOUCHERS_REPOSITORY',
			useFactory: (dataSource) => dataSource.getRepository(Vouchers),
			inject: ['DATA_SOURCE'],
		},
		{
			provide: 'REQUEST_SERVICES_REPOSITORY',
			useFactory: (dataSource) => dataSource.getRepository(RequestServices),
			inject: ['DATA_SOURCE'],
		},
		VouchersService,
	],
	exports: [VouchersService, 'VOUCHERS_REPOSITORY'],
})
export class VouchersModule {
}

