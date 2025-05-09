import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { In, Repository } from 'typeorm'
import { Category } from './entities/categories.entity'
import { CreateCategoryDto } from './dto/create.dto'
import { UpdateCategoryDto } from './dto/update.dto'
import { plainToInstance } from 'class-transformer'
import { FilesS3Service } from 'azure-storage/aws-storage.service'

@Injectable()
export class CategoriesService {
	constructor(
		@Inject('CATEGORY_REPOSITORY')
		private categoryRepository: Repository<Category>,
		private readonly filesAzureService: FilesS3Service, // Inject TouchPointsSegrvice
	) {
	}

	async create(createCategoryDto: CreateCategoryDto, file) {
		let avatarUrl = null

		// Create proper name object
		const nameObject = {
			ar: createCategoryDto.name_ar,
			en: createCategoryDto.name_en,
		}

		// Remove name_ar and name_en from the DTO
		const { name_ar, name_en, ...cleanedDto } = createCategoryDto

		// Upload file to Azure if avatar exists
		if (file) {
			avatarUrl = await this.filesAzureService.uploadFile(file, 'users')
		}

		const category = this.categoryRepository.create({
			...cleanedDto,
			name: nameObject,
			avatar: avatarUrl,
		})

		return this.categoryRepository.save(category)
	}

	async findAll(page, perPage, filterOptions) {
		page = page || 1
		perPage = perPage || 10
		const queryBuilder = this.categoryRepository.createQueryBuilder('user')

		// Apply filters based on filterOptions
		if (filterOptions) {
			if (filterOptions.search) {
				const searchString = await filterOptions.search.startsWith(' ')
					? filterOptions.search.replace(' ', '+')
					: filterOptions.search
				filterOptions.search = searchString
				queryBuilder.andWhere('(user.type LIKE :search)', {
					search: `%${filterOptions.search}%`,
				})
			}
			queryBuilder.orderBy('user.updatedAt', 'DESC')

			Object.keys(filterOptions).forEach((key) => {
				if (key !== 'search' && filterOptions[key]) {
					queryBuilder.andWhere(`user.${key} = :${key}`, {
						[key]: filterOptions[key],
					})
				}
			})
		}

		const [categories, total] = await queryBuilder
			.skip((page - 1) * perPage)
			.take(perPage)
			.getManyAndCount()

		return { categories, total }
	}

	async findOne(id: string) {
		const category = await this.categoryRepository.findOne({ where: { id: id } })
		if (!category) {
			throw new NotFoundException(`Category with ID ${id} not found`)
		}
		return category
	}

	async findByType(type: string) {
		let searchTypes = [type]

		if (type === 'Complaint') {
			searchTypes = [
				'Mall Complaint',
				'Shops Complaint',
				'Tenant Complaint',
			]
		}

		const categories = await this.categoryRepository.find({
			where: { type: In(searchTypes) },
			select: {
				id: true,
				name: true,
				type: true,
				avatar: true,
			},
		})
		if (!categories.length) {
			throw new NotFoundException(`No categories found for type ${type}`)
		}

		return categories
	}

	async findByComplaintType(type: string) {
		const category = await this.categoryRepository.find({
			where: { type },
			select: {
				id: true,
				name: true,
			},
		})
		if (!category) {
			throw new NotFoundException(`Category with ID ${type} not found`)
		}
		return category
	}

	async findAllCategory() {
		return this.categoryRepository.find()
	}

	async update(
		id: string,
		updateCategoryDto: UpdateCategoryDto,
		file: Express.Multer.File,
	) {
		await this.findOne(id)

		// Create proper name object
		const nameObject = {
			ar: updateCategoryDto.name_ar,
			en: updateCategoryDto.name_en,
		}

		// Remove name_ar and name_en from the DTO
		const { name_ar, name_en, ...cleanedDto } = updateCategoryDto

		let avatarUrl = null
		if (file) {
			avatarUrl = await this.filesAzureService.uploadFile(file, 'users')
		}

		// Update with cleaned DTO and proper name object
		await this.categoryRepository.update(id, {
			...cleanedDto,
			name: nameObject,
			avatar: avatarUrl || undefined,
		})

		return this.findOne(id)
	}

	// Delete a category by ID
	async remove(id: string) {
		const category = await this.findOne(id)
		await this.categoryRepository.remove(category)
	}
}
