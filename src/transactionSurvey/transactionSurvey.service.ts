import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransactionSurvey } from './entities/transactionSurvey.entity';
import { CreateTransactionSurveyDto } from './dto/create.dto';
import { UpdateTransactionSurveyDto } from './dto/update.dto';
import { Touchpoint } from '../touchpoint/entities/touchpoint.entity';
import { TouchPointsService } from 'touchpoint/touch-points.service';
import { ComplaintsService } from 'complaint/complaint.service';

@Injectable()
export class TransactionSurveyService {
  constructor(
    @Inject('TRANSACTION_SURVEY_REPOSITORY')
    private readonly transactionSurveyRepository: Repository<TransactionSurvey>,
    @Inject('TOUCHPOINT_REPOSITORY')
    private readonly touchPointRepository: Repository<Touchpoint>,
    private readonly dataSource: DataSource,
    private readonly touchPointsService: TouchPointsService, // Inject TouchPointsSegrvice
    private readonly complaintsService: ComplaintsService, // Inject TouchPointsSegrvice
  ) { }


  async create(createTransactionSurveyDto: any) {
    var count = 0
    var rateVar = 0
    for (let i = 0; i < createTransactionSurveyDto.answers.length; i++) {
      if (createTransactionSurveyDto.answers[i].type === "rating") {
        count++
        const rate = Number(createTransactionSurveyDto.answers[i].answer) / Number(createTransactionSurveyDto.answers[i].choices);
        rateVar = rateVar + rate
      }
    }
    const final_rate = rateVar / count
    createTransactionSurveyDto.rating = final_rate.toFixed(1).toString()
    const id = createTransactionSurveyDto.touchPointId
    await this.touchPointsService.update(id, createTransactionSurveyDto.rating)
    const transactionSurvey = this.transactionSurveyRepository.create(createTransactionSurveyDto);
    const savedSurvey = await this.transactionSurveyRepository.save(transactionSurvey);
    for (let i = 0; i < createTransactionSurveyDto.answers.length; i++) {
      if(createTransactionSurveyDto.answers[i].type === "multiple"){
        if(createTransactionSurveyDto.answers[i].answer < 3 ){
          // console.log(savedSurvey)
          // const complaint_data = {
          //   status: "Open",
          //   metadata: {
          //     additional_information: updateCommentDto.message,
          //     channel: "survey",
          //     contact_choices: "",
          //     time_incident: transactionSurvey.createdAt,
          //   },
          //   name: "Survey Complaint",
          //   customer:data.customer,
          //   tenant:{},
          //   category:data.category,
          //   touchpoint:updateCommentDto.metadata.Touchpoint,
          //   sections: {},
          //   addedBy: "system",
          //   type: updateCommentDto.metadata.ComplaintType,
    
          // }
          // await this.complaintsService.create(complaint_data)
        }
      }
    }
    return savedSurvey;
  }
  async findAlls(): Promise<TransactionSurvey[]> {
    return this.transactionSurveyRepository.find({
      relations: ['customer', 'survey'],
    });
  }
  async findAll(page: number, perPage: number, filterOptions: any) {
    page = page || 1;
    perPage = perPage || 10;

    const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('transactionSurvey')
      .leftJoinAndSelect('transactionSurvey.customer', 'customer') // Include customer relationship
      .leftJoinAndSelect('transactionSurvey.survey', 'survey');
    // Apply filters based on filterOpdtions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = filterOptions.search.trim().startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;

        filterOptions.search = searchString;

        queryBuilder.andWhere('(survey.name ILIKE :search OR customer.name ILIKE :search OR transactionSurvey.state ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });
      }

      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`transactionSurvey.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }

    const [categories, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { categories, total };
  }
  async findAllState(page: number, perPage: number, filterOptions: any, surveyId: string) {
    page = page || 1;
    perPage = perPage || 10;

    const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('transactionSurvey')
      .leftJoinAndSelect('transactionSurvey.customer', 'customer') // Include customer relationship
      .leftJoinAndSelect('transactionSurvey.survey', 'survey');

    // Filter by surveyId
    // queryBuilder.andWhere('transactionSurvey.surveyId = :surveyId', { surveyId });

    // Apply additional filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = filterOptions.search.trim().startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;

        filterOptions.search = searchString;

        queryBuilder.andWhere('(transactionSurvey.state ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });
      }

      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`transactionSurvey.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }
    queryBuilder.andWhere('transactionSurvey.surveyId = :surveyId', { surveyId });

    const [categories, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { categories, total };
  }
  async findOne(id: string): Promise<TransactionSurvey> {
    return this.transactionSurveyRepository.findOne({
      where: { id },
      relations: ['customer', 'survey'], // Fetch customer relationship
    });
  }
  async update(id: string, updateTransactionSurveyDto: any) {
    await this.findOne(id);
    await this.transactionSurveyRepository.update(id, updateTransactionSurveyDto);
    return this.findOne(id);
  }
  async remove(id: string) {
    const survey = await this.findOne(id);
    await this.transactionSurveyRepository.remove(survey);
  }
  async reportData(id: string, from: string, to: string, filter: string, category: string, touchpoint: string) {
    const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('survey');

    queryBuilder.where('survey.surveyId = :id', { id });

    // Filter by date range
    if (from && to) {
      queryBuilder.andWhere('survey.createdAt BETWEEN :from AND :to', { from, to });
    } else if (from) {
      queryBuilder.andWhere('survey.createdAt >= :from', { from });
    } else if (to) {
      queryBuilder.andWhere('survey.createdAt <= :to', { to });
    }

    // Filter by category
    if (category) {
      queryBuilder.andWhere('survey.categoryId = :category', { category });
    }

    // Filter by touchpoint
    if (touchpoint) {
      queryBuilder.andWhere('survey.touchPointId = :touchpoint', { touchpoint });
    }

    // Select and group data based on the filter
    switch (filter) {
      case 'daily':
        queryBuilder
          .select("DATE(survey.createdAt) as date")
          .addSelect("COUNT(*) as value")
          .groupBy("DATE(survey.createdAt)")
          .orderBy("DATE(survey.createdAt)", "ASC");
        break;
      case 'weekly':
        queryBuilder
          .select("TO_CHAR(DATE_TRUNC('week', survey.createdAt), 'YYYY-MM-DD') as date")
          .addSelect("COUNT(*) as value")
          .groupBy("DATE_TRUNC('week', survey.createdAt)")
          .orderBy("DATE_TRUNC('week', survey.createdAt)", "ASC");
        break;
      case 'monthly':
        queryBuilder
          .select("TO_CHAR(DATE_TRUNC('month', survey.createdAt), 'YYYY-MM-DD') as date")
          .addSelect("COUNT(*) as value")
          .groupBy("DATE_TRUNC('month', survey.createdAt)")
          .orderBy("DATE_TRUNC('month', survey.createdAt)", "ASC");
        break;
      default:
        throw new Error('Invalid filter type. Use daily, weekly, or monthly.');
    }

    const data = await queryBuilder.getRawMany();

    if (!data.length) {
      return [];
    }

    return data.map(row => ({ date: row.date, value: Number(row.value) }));
  }
  async getAverageTouchpointsForSurvey() {
    const result = await this.dataSource.query(
      `
      SELECT 
          touchpoint_id, 
          COUNT(*) AS transaction_count
      FROM transaction_survey
      GROUP BY touchpoint_id
      ORDER BY transaction_count DESC
      LIMIT 1;
      `,
    );
    const result_least = await this.dataSource.query(
      `
      SELECT 
          touchpoint_id, 
          COUNT(*) AS transaction_count
      FROM transaction_survey
      GROUP BY touchpoint_id
      ORDER BY transaction_count ASC
      LIMIT 1;
      `,
    );

    const most_data = await this.touchPointRepository.find({
      where: { id: result[0].touchpoint_id },
    });
    const least_data = await this.touchPointRepository.find({
      where: { id: result_least[0].touchpoint_id },
    });
    return {
      most_touchpoints: {
        touchpoint: most_data,
        ...result[0]
      },
      least_touchpoints: {
        touchpoint: least_data,
        ...result_least[0]
      }
    };
  }
  async getAverageTouchpointsDate(fromDate: string, toDate: string) {
    const result = await this.dataSource.query(
      `
      SELECT 
          touchpoint_id, 
          COUNT(*) AS transaction_count
      FROM transaction_survey
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY touchpoint_id
      ORDER BY transaction_count DESC
      LIMIT 1;
      `,
      [fromDate, toDate],
    );
    if (result.length === 0) {
      return { most_touchpoints: null };
    }
    const mostData = await this.touchPointRepository.findOne({
      select: ['id', 'name', 'description'],
      where: { id: result[0].touchpoint_id },
    });
    return {
      most_touchpoints: {
        touchpoint: mostData,
        ...result[0],
      },
    };
  }
  async findOneServey(id: string) {
    return this.transactionSurveyRepository.find({
      where: { surveyId: id },
      relations: ['customer', 'survey'], // Fetch customer relationship
    });
  }
  async getRatingsBySurveyCategoryAndTouchPoint(
    surveyId: string,
    categoryId: string,
    touchpointId: string,
  ) {
    const transactions = await this.transactionSurveyRepository.find({
      where: { surveyId, categoryId, touchpointId },
      select: ['answers'],
    });

    const ratings = transactions
      .flatMap((transaction) => transaction.answers || [])
      .filter((answer) => answer.type === 'rating')
      .map(({ question, answer, choices }) => ({
        question,
        rating: choices ? parseFloat(answer) / 5 : null,
      }));

    // Grouping by question
    const groupedRatings = ratings.reduce((acc, { question, rating }) => {
      const questionKey =
        typeof question === 'object'
          ? JSON.stringify(question)
          : question; // Handle object questions
      if (!acc[questionKey]) {
        acc[questionKey] = {
          question,
          ratings: [],
        };
      }
      acc[questionKey].ratings.push(rating);
      return acc;
    }, {});

    // Format the grouped result
    return Object.values(groupedRatings).map(({ question, ratings }) => ({
      question,
      averageRating: (ratings.reduce((sum, r) => sum + (r || 0), 0) / ratings.length).toFixed(1),
    }));
  }
  async getRatings(
    filterOptions: {
      categoryId?: string;
      touchPointId?: string;
      customerAge?: string;
      customerGender?: string;
      dateRange?: { from: Date; to: Date };
    }
  ) {
    const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('transactionSurvey')
      .leftJoinAndSelect('transactionSurvey.customer', 'customer');

    // Filter by category
    if (filterOptions.categoryId) {
      queryBuilder.andWhere('transactionSurvey.categoryId = :categoryId', {
        categoryId: filterOptions.categoryId,
      });
    }

    // Filter by touchPoint
    if (filterOptions.touchPointId) {
      queryBuilder.andWhere('transactionSurvey.touchPointId = :touchPointId', {
        touchPointId: filterOptions.touchPointId,
      });
    }


    if (filterOptions.customerAge) {
      queryBuilder.andWhere('customer.age = :customerAge', {
        customerAge: filterOptions.customerAge,
      });
    }


    // Filter by customer gender
    if (filterOptions.customerGender) {
      queryBuilder.andWhere('customer.gender = :customerGender', {
        customerGender: filterOptions.customerGender,
      });
    }

    // Filter by date range
    if (filterOptions.dateRange) {
      queryBuilder.andWhere('transactionSurvey.createdAt BETWEEN :from AND :to', {
        from: filterOptions.dateRange.from,
        to: filterOptions.dateRange.to,
      });
    }

    const results = await queryBuilder.getRawMany();

    // Calculate average rating
    const ratings = results.map((item) => parseFloat(item.transactionSurvey_rating));
    const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length || 0;

    return {
      avgRating, surveyCount: results.length
    };
  }
  async getCustomerSurvey(
    filterOptions: {
      cutomerId?: string;
    }
  ) {
    const queryBuilder = this.transactionSurveyRepository.createQueryBuilder('transactionSurvey')
    .leftJoinAndSelect('transactionSurvey.customer', 'customer')
    .leftJoinAndSelect('transactionSurvey.category', 'categories')

    if (filterOptions.cutomerId) {
      queryBuilder.andWhere('customer.id = :cutomerId', {
        cutomerId: filterOptions.cutomerId,
      });
    }
    const results = await queryBuilder.getRawMany();
    return {
      results
    };
  }

}
