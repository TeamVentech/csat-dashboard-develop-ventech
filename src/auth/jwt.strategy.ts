import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from '../users/users.service'
import { CustomersService } from '../customers/customers.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly usersService: UsersService,
		configService: ConfigService,
		private customersService: CustomersService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: configService.get('JWT_SECRET'),
		})
	}

	async validate(payload: any) {
		if (payload.role === 'customer') {
			const customer = await this.customersService.findOne(payload.id)
			console.log(customer)
			if (!customer) {
				throw new UnauthorizedException('Customer not found')
			}
			return Object.assign(customer, { role: 'Regular User' })
		} else {
			const user = await this.usersService.findOne(payload.id)
			if (!user) {
				throw new UnauthorizedException('User not found')
			}
			return user
		}
	}
}
