import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create.dto';
import { UpdateCommentDto } from './dto/update.dto';
import { Complaints } from 'complaint/entities/complaint.entity';
import { ComplaintsService } from 'complaint/complaint.service';
import { RequestServicesService } from 'requestServices/requestServices.service';
import { TouchPointsService } from 'touchpoint/touch-points.service';

@Injectable()
export class CommentService {
  constructor(
    @Inject('COMMENT_REPOSITORY')
    private readonly commentRepository: Repository<Comment>,
    private readonly complaintService: ComplaintsService,
    private readonly suggestionService: RequestServicesService,
    private readonly touchPointsService: TouchPointsService

  ) { }

  async create(createCommentDto: CreateCommentDto) {
    const department = this.commentRepository.create(createCommentDto);
    return this.commentRepository.save(department);
  }

  async findAll(page, perPage, filterOptions, state) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.commentRepository.createQueryBuilder('comments')
      .leftJoinAndSelect('comments.category', 'category')
      .leftJoinAndSelect('comments.survey', 'survey')
      .leftJoinAndSelect('comments.customer', 'customer');

    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(customer.name ILIKE :search)', {
          search: `%${filterOptions.search}%`,
        });

      }

      if (state) {
        queryBuilder.andWhere(`comments.status ILIKE :state`, {
          state: `%${state}%`,
        });
      }

      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`comments.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string) {
    const Comment = await this.commentRepository.findOne({
      where: { id: id },
      relations: ['customer', 'category'],
    });
    if (!Comment) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return Comment;
  }

  // async findType(type: string){
  //   const Comment = await this.commentRepository.find({ where: { su: type } });
  //   if (!Comment) {
  //     throw new NotFoundException(`Department with ID ${type} not found`);
  //   }
  //   return Comment;
  // }

  async update(id: string, updateCommentDto: UpdateCommentDto) {
    const data = await this.findOne(id);
    await this.commentRepository.update(id, updateCommentDto);
    if (data.status === "Open" && updateCommentDto.status === "Moved To Complaints") {
      // await this.complaintService.create({
      //   state: "Open",
      //   metadata: updateCommentDto.metadata,
      //   name: "Comment Complaint",
      //   customerId: updateCommentDto.customerId,
      //   touchpointId: updateCommentDto.touchpointId,
      //   categoryId: updateCommentDto.categoryId,
      //   addedBy: "system",
      //   type: "Comment",
      // })
    }
    if (data.status === "Open" && updateCommentDto.status === "Moved To Suggestions") {
      await this.suggestionService.create({
        state: "Pending",
        metadata: {
          customer: data.customer,
          Signature:"",
          Department:"",
          Suggestion: updateCommentDto.message,
          department: updateCommentDto.metadata.ConcernedDepartment,
          touchpoint:updateCommentDto.metadata.SuggestionTouchpoint,
          category:updateCommentDto.metadata.SuggestionCategory

        },
        name: "Suggestion Box",
        addedBy: "system",
        type: "Suggestion Box",
        rating: null,
        actions:""
      })
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    const Comment = await this.findOne(id);
    await this.commentRepository.remove(Comment);
  }
}
