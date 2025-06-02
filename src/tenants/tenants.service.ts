import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { Tenant } from './entities/tenants.entity'
import { CreateTenantDto } from './dto/create.dto'
import { UpdateTenantDto } from './dto/update.dto'
import { PhoneValidator } from '../utils/phone-validator.util'

@Injectable()
export class TenantsService {
	constructor(
		@Inject('TENANTS_REPOSITORY')
		private readonly tenantRepository: Repository<Tenant>,
	) {
	}

	async create(createTenantDto: CreateTenantDto) {
		try {
			// Format phone number if provided
			if (createTenantDto.phone_number) {
				createTenantDto.phone_number = PhoneValidator.formatPhoneNumber(createTenantDto.phone_number)
			}

			// Format emails to lowercase if provided
			if (createTenantDto.email) {
				createTenantDto.email = createTenantDto.email.toLowerCase()
			}

			if (createTenantDto.manager_email) {
				createTenantDto.manager_email = createTenantDto.manager_email.toLowerCase()
			}

			const tenant = this.tenantRepository.create(createTenantDto)
			return this.tenantRepository.save(tenant)
		} catch (error) {
			throw new HttpException(error.message || 'Failed to create tenant', HttpStatus.BAD_REQUEST)
		}
	}

	async findAll(page, perPage, filterOptions) {
		page = page || 1
		perPage = perPage || 100
		const queryBuilder = this.tenantRepository.createQueryBuilder('user')

		// Apply filters based on filterOptions
		if (filterOptions) {
			if (filterOptions.search) {
				const searchString = await filterOptions.search.startsWith(' ')
					? filterOptions.search.replace(' ', '+')
					: filterOptions.search
				filterOptions.search = searchString
				queryBuilder.andWhere('("user"."name" ILIKE :search OR "user"."email" ILIKE :search OR "user"."phone_number" ILIKE :search OR "user"."manager_email" ILIKE :search OR "user"."contact_name" ILIKE :search OR "user"."manager_account" ILIKE :search OR "user"."id"::text ILIKE :search)', {
					search: `%${filterOptions.search}%`, // Use wildcards for substring search
				})
			}
			Object.keys(filterOptions).forEach(key => {
				if (key !== 'search' && filterOptions[key]) {
					queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] })
				}
			})
		}
		queryBuilder.orderBy('user.updatedAt', 'DESC')

		const [categories, total] = await queryBuilder
			.skip((page - 1) * perPage)
			.take(perPage)
			.getManyAndCount()

		return { categories, total }
	}

	async findOne(id: string): Promise<Tenant> {
		const tenant = await this.tenantRepository.findOne({ where: { id } })
		if (!tenant) {
			throw new NotFoundException(`Tenant with ID ${id} not found`)
		}
		return tenant
	}

	async findAllTenants(filterOptions?: any) {
		console.log(filterOptions)
		const queryBuilder = this.tenantRepository.createQueryBuilder('user');
		// Apply filters based on filterOptions
		if (filterOptions) {
			if (filterOptions.search) {
				const searchString = await filterOptions.search.startsWith(' ')
					? filterOptions.search.replace(' ', '+')
					: filterOptions.search;
				filterOptions.search = searchString
				queryBuilder.andWhere('("user"."email" ILIKE :search OR "user"."name" ILIKE :search OR "user"."phone_number" ILIKE :search OR "user"."manager_email" ILIKE :search OR "user"."contact_name" ILIKE :search OR "user"."manager_account" ILIKE :search)', {
					search: `%${filterOptions.search}%`,
				});
			}
			Object.keys(filterOptions).forEach(key => {
				if (key !== 'search' && filterOptions[key]) {
					queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
				}
			});
		}

		queryBuilder.orderBy('user.createdAt', 'DESC');

		return queryBuilder.getMany();
	}

	async findByPhoneNumber(phone_number: string): Promise<Tenant> {
		const formattedPhoneNumber = PhoneValidator.formatPhoneNumber(phone_number)
		return await this.tenantRepository.findOne({ where: { phone_number: formattedPhoneNumber } })
	}

	async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
		await this.findOne(id)

		// Format phone number if provided in update
		if (updateTenantDto.phone_number) {
			updateTenantDto.phone_number = PhoneValidator.formatPhoneNumber(updateTenantDto.phone_number)
		}

		// Format emails to lowercase if provided
		if (updateTenantDto.email) {
			updateTenantDto.email = updateTenantDto.email.toLowerCase()
		}

		if (updateTenantDto.manager_email) {
			updateTenantDto.manager_email = updateTenantDto.manager_email.toLowerCase()
		}

		await this.tenantRepository.update(id, updateTenantDto)
		return this.findOne(id)
	}

	async remove(id: string): Promise<void> {
		const tenant = await this.findOne(id) // Check if the tenant exists
		await this.tenantRepository.remove(tenant)
	}

	async removeMultiple(ids: string[]): Promise<any> {
		const results = [];
		
		for (const id of ids) {
			try {
				const tenant = await this.findOne(id);
				await this.tenantRepository.remove(tenant);
				results.push({ id, success: true });
			} catch (error) {
				results.push({ id, success: false, message: error.message });
			}
		}
		
		return {
			message: 'Tenants deletion completed',
			results
		};
	}
}
