import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UsersModule } from '../users/users.module'
import { CustomersModule } from 'customers/customers.module'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { JwtStrategy } from './jwt.strategy'
import { AuthController } from './auth.controller'
import { LocalStrategy } from './local.strategy'
import { RolesModule } from '../roles/roles.module'

@Module({
	imports: [
		UsersModule,
		PassportModule,
		RolesModule,
		JwtModule.register({
			secret: process.env.JWT_SECRET || 'defaultSecretKey', // Use environment variable for production
			signOptions: { expiresIn: '3h' }, // Token expiration
		}),
		CustomersModule,
	],
	providers: [AuthService, JwtStrategy, LocalStrategy],
	controllers: [AuthController],
})
export class AuthModule {
}
