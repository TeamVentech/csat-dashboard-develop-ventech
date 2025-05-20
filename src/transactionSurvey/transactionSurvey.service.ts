import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { TransactionSurvey } from './entities/transactionSurvey.entity'
import { CreateTransactionSurveyDto } from './dto/create.dto'
import { UpdateTransactionSurveyDto } from './dto/update.dto'
import { Touchpoint } from '../touchpoint/entities/touchpoint.entity'
import { TouchPointsService } from 'touchpoint/touch-points.service'
import { ComplaintsService } from 'complaint/complaint.service'
import { CustomersService } from 'customers/customers.service'
import { ElasticService } from '../ElasticSearch/elasticsearch.service'
import { CategoriesService } from '../categories/categories.service'
import { CommentService } from '../comment/comment.service'
import { CreateCommentDto } from '../comment/dto/create.dto'

@Injectable()
export class TransactionSurveyService {
	constructor(
		@Inject('TRANSACTION_SURVEY_REPOSITORY')
		private readonly transactionSurveyRepository: Repository<TransactionSurvey>,
		@Inject('TOUCHPOINT_REPOSITORY')
		private readonly touchPointRepository: Repository<Touchpoint>,
		private readonly dataSource: DataSource,
		private readonly touchPointsService: TouchPointsService,
		private readonly complaintsService: ComplaintsService,
		private readonly customerService: CustomersService,
		private readonly elasticService: ElasticService,
		private readonly categoryService: CategoriesService,
		private readonly commentService: CommentService,
	) {
	}


	async create(createTransactionSurveyDto: CreateTransactionSurveyDto) {
		try {
			// Calculate rating
			const ratingAnswers = createTransactionSurveyDto.answers.filter(answer => answer.type === 'multiple')

			const count = ratingAnswers.length
			if (count > 0) {
				const totalSum = ratingAnswers.reduce((sum, answer) => sum + Number(answer.answer), 0)
				createTransactionSurveyDto.rating = ((totalSum / count) / 5).toFixed(1).toString()
			} else {
				createTransactionSurveyDto.rating = '0'
			}

			// Update touchpoint rating
			await this.touchPointsService.update(createTransactionSurveyDto.touchpointId, createTransactionSurveyDto.rating)
			const touchpoints = await this.touchPointsService.findOne(createTransactionSurveyDto.touchpointId)
			// Create transaction survey
			createTransactionSurveyDto.touchpoint = {
				name: {...touchpoints.name},
				id: touchpoints.id,
			}
			const transactionSurvey = this.transactionSurveyRepository.create(createTransactionSurveyDto)
			const savedSurvey = await this.transactionSurveyRepository.save(transactionSurvey)
			const surveyData = Array.isArray(savedSurvey) ? savedSurvey[0] : savedSurvey

			if (!surveyData) {
				throw new Error('Failed to save transaction survey')
			}

			const completeData = await this.findOne(surveyData.id)
			const [touchpoint, category, customer] = await Promise.all([
				this.touchPointsService.findOne(completeData.touchpointId),
				this.categoryService.findOne(completeData.categoryId),
				this.customerService.findOne(completeData.customerId),
			])

			// Index in Elasticsearch
			try {
				await this.elasticService.indexData(
					'survey_transactions',
					surveyData.id,
					completeData,
				)
			} catch (error) {
				console.error('Error indexing survey transaction in Elasticsearch:', error)
			}

			// Process low ratings and create complaints
			const lowRatingAnswers = createTransactionSurveyDto.answers.filter(
				answer => ['multiple', 'evaluate', 'rating'].includes(answer.type) && Number(answer.answer) < 3,
			)

			if (lowRatingAnswers.length > 0) {
				const complaintPromises = lowRatingAnswers.map(async (answer) => {
					const complaintData = {
						status: 'Open',
						metadata: {
							additional_information: '',
							answer: answer.answer,
							channel: 'survey',
							contact_choices: '',
							time_incident: surveyData?.createdAt,
							survey_id: createTransactionSurveyDto.surveyId,
							question_id: answer.id,
						},
						name: 'Survey Complaint',
						customer: { ...customer },
						tenant: null,
						category: {
							name: { ...category.name },
							id: category.id,
						},
						touchpoint: {
							name: { ...touchpoint.name },
							id: touchpoint.id,
						},
						sections: {},
						addedBy: 'system',
						type: 'Survey Complaint',
					}
					if (answer.comment) {
						complaintData.metadata.additional_information = answer.comment
					}
					return this.complaintsService.create(complaintData)
				})

				await Promise.all(complaintPromises)
			}

			// Process comments
			/*			const commentsWithAnswers = createTransactionSurveyDto.answers.filter(answer => answer.comment)
						if (commentsWithAnswers.length > 0) {
							const commentPromises = commentsWithAnswers.map(answer => {
								const createCommentDto: CreateCommentDto = {
									customerId: createTransactionSurveyDto.customerId,
									categoryId: createTransactionSurveyDto?.categoryId || null,
									touchpointId: createTransactionSurveyDto.touchpointId,
									surveyId: createTransactionSurveyDto.surveyId,
									touchpointName: touchpoint.name,
									status: 'Open',
									message: answer.comment,
									type: 'Survey Comment',
									metadata: {
										questionId: answer.id,
									},
								}
								return this.commentService.create(createCommentDto)
							})

							await Promise.all(commentPromises)
						}*/

			return savedSurvey
		} catch (error) {
			console.error('Error creating transaction survey:', error)
			throw error
		}
	}

	async findAlls(): Promise<TransactionSurvey[]> {
		return this.transactionSurveyRepository.find({
			relations: ['customer', 'survey'],
		})
	}

	async findAll(page: number, perPage: number, filterOptions: any) {
		page = page || 1
		perPage = perPage || 10

		const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('transactionSurvey')
			.leftJoinAndSelect('transactionSurvey.customer', 'customer') // Include customer relationship
			.leftJoinAndSelect('transactionSurvey.survey', 'survey')
		// Apply filters based on filterOpdtions
		if (filterOptions) {
			if (filterOptions.search) {
				const searchString = filterOptions.search.trim().startsWith(' ')
					? filterOptions.search.replace(' ', '+')
					: filterOptions.search

				filterOptions.search = searchString

				queryBuilder.andWhere('(survey.name ILIKE :search OR customer.name ILIKE :search OR transactionSurvey.state ILIKE :search)', {
					search: `%${filterOptions.search}%`, // Use wildcards for substring search
				})
			}

			Object.keys(filterOptions).forEach(key => {
				if (key !== 'search' && filterOptions[key]) {
					queryBuilder.andWhere(`transactionSurvey.${key} = :${key}`, { [key]: filterOptions[key] })
				}
			})
		}

		const [categories, total] = await queryBuilder
			.skip((page - 1) * perPage)
			.take(perPage)
			.getManyAndCount()

		return { categories, total }
	}

	async findAllState(page: number, perPage: number, filterOptions: any, surveyId: string) {
		page = page || 1
		perPage = perPage || 10

		const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('transactionSurvey')
			.leftJoinAndSelect('transactionSurvey.customer', 'customer') // Include customer relationship
			.leftJoinAndSelect('transactionSurvey.survey', 'survey')

		// Filter by surveyId
		// queryBuilder.andWhere('transactionSurvey.surveyId = :surveyId', { surveyId });

		// Apply additional filters based on filterOptions
		if (filterOptions) {
			if (filterOptions.search) {
				const searchString = filterOptions.search.trim().startsWith(' ')
					? filterOptions.search.replace(' ', '+')
					: filterOptions.search

				filterOptions.search = searchString

				queryBuilder.andWhere('(transactionSurvey.state ILIKE :search)', {
					search: `%${filterOptions.search}%`, // Use wildcards for substring search
				})
			}

			Object.keys(filterOptions).forEach(key => {
				if (key !== 'search' && filterOptions[key]) {
					queryBuilder.andWhere(`transactionSurvey.${key} = :${key}`, { [key]: filterOptions[key] })
				}
			})
		}
		queryBuilder.orderBy('transactionSurvey.createdAt', 'DESC');

		queryBuilder.andWhere('transactionSurvey.surveyId = :surveyId', { surveyId })

		const [categories, total] = await queryBuilder
			.skip((page - 1) * perPage)
			.take(perPage)
			.getManyAndCount()

		return { categories, total }
	}

	async findOne(id: string): Promise<TransactionSurvey> {
		return this.transactionSurveyRepository.findOne({
			where: { id },
			relations: ['customer', 'survey'], // Fetch customer relationship
		})
	}

	async findOneById(id: string, query: any, page: number, perPage: number) {
		const transaction = await this.elasticService.search('survey_transactions', query, page, perPage)
		return transaction
	}

	async update(id: string, updateTransactionSurveyDto: any) {
		await this.findOne(id)
		await this.transactionSurveyRepository.update(id, updateTransactionSurveyDto)
		const updatedSurvey = await this.findOne(id)

		// Update the document in Elasticsearch
		try {
			await this.elasticService.updateDocument(
				'survey_transactions',
				id,
				{
					...updatedSurvey,
					metadata: {
						surveyName: updatedSurvey.survey?.name,
						customerName: updatedSurvey.customer?.name,
						customerGender: updatedSurvey.customer?.gender,
						customerAge: updatedSurvey.customer?.age,
						categoryId: updatedSurvey.categoryId,
						touchpointId: updatedSurvey.touchpointId,
						rating: updatedSurvey.rating,
						state: updatedSurvey.state,
					},
				},
			)
		} catch (error) {
			console.error('Error updating survey transaction in Elasticsearch:', error)
			// Proceed even if indexing fails, don't block the update operation
		}

		return updatedSurvey
	}

	async remove(id: string) {
		const survey = await this.findOne(id)
		await this.transactionSurveyRepository.remove(survey)

		// Delete the document from Elasticsearch
		try {
			await this.elasticService.deleteDocument('survey_transactions', id)
		} catch (error) {
			console.error('Error deleting survey transaction from Elasticsearch:', error)
			// Proceed even if deletion fails
		}
	}

	async reportData(id: string, from: string, to: string, filter: string, category: string, touchpoint: string) {
		const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('survey')

		queryBuilder.where('survey.surveyId = :id', { id })

		// Filter by date range
		if (from && to) {
			queryBuilder.andWhere('survey.createdAt BETWEEN :from AND :to', { from, to })
		} else if (from) {
			queryBuilder.andWhere('survey.createdAt >= :from', { from })
		} else if (to) {
			queryBuilder.andWhere('survey.createdAt <= :to', { to })
		}

		// Filter by category
		if (category) {
			queryBuilder.andWhere('survey.categoryId = :category', { category })
		}

		// Filter by touchpoint
		if (touchpoint) {
			queryBuilder.andWhere('survey.touchPointId = :touchpoint', { touchpoint })
		}

		// Select and group data based on the filter
		switch (filter) {
			case 'daily':
				queryBuilder
					.select('DATE(survey.createdAt) as date')
					.addSelect('COUNT(*) as value')
					.groupBy('DATE(survey.createdAt)')
					.orderBy('DATE(survey.createdAt)', 'ASC')
				break
			case 'weekly':
				queryBuilder
					.select('TO_CHAR(DATE_TRUNC(\'week\', survey.createdAt), \'YYYY-MM-DD\') as date')
					.addSelect('COUNT(*) as value')
					.groupBy('DATE_TRUNC(\'week\', survey.createdAt)')
					.orderBy('DATE_TRUNC(\'week\', survey.createdAt)', 'ASC')
				break
			case 'monthly':
				queryBuilder
					.select('TO_CHAR(DATE_TRUNC(\'month\', survey.createdAt), \'YYYY-MM-DD\') as date')
					.addSelect('COUNT(*) as value')
					.groupBy('DATE_TRUNC(\'month\', survey.createdAt)')
					.orderBy('DATE_TRUNC(\'month\', survey.createdAt)', 'ASC')
				break
			default:
				throw new Error('Invalid filter type. Use daily, weekly, or monthly.')
		}

		const data = await queryBuilder.getRawMany()

		if (!data.length) {
			return []
		}

		return data.map(row => ({ date: row.date, value: Number(row.value) }))
	}

	async getAverageTouchpointsForSurvey() {
		const result = await this.dataSource.query(
			`
                SELECT touchpoint_id,
                       COUNT(*) AS transaction_count
                FROM transaction_survey
                GROUP BY touchpoint_id
                ORDER BY transaction_count DESC LIMIT 1;
			`,
		)
		const result_least = await this.dataSource.query(
			`
                SELECT touchpoint_id,
                       COUNT(*) AS transaction_count
                FROM transaction_survey
                GROUP BY touchpoint_id
                ORDER BY transaction_count ASC LIMIT 1;
			`,
		)

		const most_data = await this.touchPointRepository.find({
			where: { id: result[0].touchpoint_id },
		})
		const least_data = await this.touchPointRepository.find({
			where: { id: result_least[0].touchpoint_id },
		})
		return {
			most_touchpoints: {
				touchpoint: most_data,
				...result[0],
			},
			least_touchpoints: {
				touchpoint: least_data,
				...result_least[0],
			},
		}
	}

	async getAverageTouchpointsDate(fromDate: string, toDate: string) {
		const result = await this.dataSource.query(
			`
                SELECT touchpoint_id,
                       COUNT(*) AS transaction_count
                FROM transaction_survey
                WHERE created_at BETWEEN $1 AND $2
                GROUP BY touchpoint_id
                ORDER BY transaction_count DESC LIMIT 1;
			`,
			[fromDate, toDate],
		)
		if (result.length === 0) {
			return { most_touchpoints: null }
		}
		const mostData = await this.touchPointRepository.findOne({
			select: ['id', 'name', 'description'],
			where: { id: result[0].touchpoint_id },
		})
		return {
			most_touchpoints: {
				touchpoint: mostData,
				...result[0],
			},
		}
	}

	async findOneServey(id: string) {
		return this.transactionSurveyRepository.find({
			where: { surveyId: id },
			relations: ['customer', 'survey'], // Fetch customer relationship
		})
	}

	async getRatingsBySurveyCategoryAndTouchPoint(
		surveyId: string,
		categoryId: string,
		touchpointId: string,
	) {
		const transactions = await this.transactionSurveyRepository.find({
			where: { surveyId, categoryId, touchpointId },
			select: ['answers'],
		})

		const ratings = transactions
			.flatMap((transaction) => transaction.answers || [])
			.filter((answer) => answer.type === 'rating')
			.map(({ question, answer, choices }) => ({
				question,
				rating: choices ? parseFloat(answer) / 5 : null,
			}))

		// Grouping by question
		const groupedRatings = ratings.reduce((acc, { question, rating }) => {
			const questionKey =
				typeof question === 'object'
					? JSON.stringify(question)
					: question // Handle object questions
			if (!acc[questionKey]) {
				acc[questionKey] = {
					question,
					ratings: [],
				}
			}
			acc[questionKey].ratings.push(rating)
			return acc
		}, {})

		// Format the grouped result
		return Object.values(groupedRatings).map(({ question, ratings }) => ({
			question,
			averageRating: (ratings.reduce((sum, r) => sum + (r || 0), 0) / ratings.length).toFixed(1),
		}))
	}

	async getRatings(
		filterOptions: {
			categoryId?: string;
			touchPointId?: string;
			customerAge?: string;
			customerGender?: string;
			dateRange?: { from: Date; to: Date };
		},
	) {
		const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('transactionSurvey')
			.leftJoinAndSelect('transactionSurvey.customer', 'customer')

		// Filter by category
		if (filterOptions.categoryId) {
			queryBuilder.andWhere('transactionSurvey.categoryId = :categoryId', {
				categoryId: filterOptions.categoryId,
			})
		}

		// Filter by touchPoint
		if (filterOptions.touchPointId) {
			queryBuilder.andWhere('transactionSurvey.touchPointId = :touchPointId', {
				touchPointId: filterOptions.touchPointId,
			})
		}


		if (filterOptions.customerAge) {
			queryBuilder.andWhere('customer.age = :customerAge', {
				customerAge: filterOptions.customerAge,
			})
		}


		// Filter by customer gender
		if (filterOptions.customerGender) {
			queryBuilder.andWhere('customer.gender = :customerGender', {
				customerGender: filterOptions.customerGender,
			})
		}

		// Filter by date range
		if (filterOptions.dateRange) {
			queryBuilder.andWhere('transactionSurvey.createdAt BETWEEN :from AND :to', {
				from: filterOptions.dateRange.from,
				to: filterOptions.dateRange.to,
			})
		}

		const results = await queryBuilder.getRawMany()

		// Calculate average rating
		const ratings = results.map((item) => parseFloat(item.transactionSurvey_rating))
		const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length || 0

		return {
			avgRating, surveyCount: results.length,
		}
	}

	async getCustomerSurvey(
		filterOptions: {
			cutomerId?: string;
		},
		page: number = 1,
		pageSize: number = 10,
	) {
		try {
			const searchQuery = {
				bool: {
					must: [],
				},
			}

			if (filterOptions.cutomerId) {
				searchQuery.bool.must.push({ match: { customerId: filterOptions.cutomerId } })
			}

			// Execute the search
			const results = await this.elasticService.searchByQuery(
				'survey_transactions',
				{ query: searchQuery },
				page,
				pageSize,
			)

			return results
		} catch (error) {
			console.error('Error searching customer surveys:', error)
			return {
				success: false,
				message: 'Error searching customer surveys',
				error: error.message || error,
			}
		}
	}

	async searchSurveyTransactions(
		query: any = {},
		page: number = 1,
		pageSize: number = 10,
	) {
		try {
			const searchQuery = {
				bool: {
					must: [],
				},
			}

			// Add query conditions based on the provided parameters
			if (query.state) {
				searchQuery.bool.must.push({ match: { 'metadata.state': query.state } })
			}

			if (query.rating) {
				searchQuery.bool.must.push({ match: { 'metadata.rating': query.rating } })
			}

			if (query.surveyId) {
				searchQuery.bool.must.push({ match: { surveyId: query.surveyId } })
			}

			if (query.categoryId) {
				searchQuery.bool.must.push({ match: { categoryId: query.categoryId } })
			}

			if (query.touchpointId) {
				searchQuery.bool.must.push({ match: { touchpointId: query.touchpointId } })
			}

			if (query.customerId) {
				searchQuery.bool.must.push({ match: { customerId: query.customerId } })
			}

			if (query.fromDate && query.toDate) {
				searchQuery.bool.must.push({
					range: {
						createdAt: {
							gte: query.fromDate,
							lte: query.toDate,
						},
					},
				})
			}

			// Execute the search
			const result = await this.elasticService.searchByQuery(
				'survey_transactions',
				{ query: searchQuery },
				page,
				pageSize,
			)

			return result
		} catch (error) {
			console.error('Error searching survey transactions:', error)
			return {
				success: false,
				message: 'Error searching survey transactions',
				error: error.message || error,
			}
		}
	}
}
