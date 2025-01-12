import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create.dto';
import { UpdateCommentDto } from './dto/update.dto';

@Injectable()
export class CommentService {
  constructor(
    @Inject('COMMENT_REPOSITORY')
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async create(createCommentDto: CreateCommentDto) {
    const department = this.commentRepository.create(createCommentDto);
    return this.commentRepository.save(department);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.commentRepository.createQueryBuilder('comments')
      .leftJoinAndSelect('comments.category', 'category') // Include customer relationship
      .leftJoinAndSelect('comments.survey', 'survey')
      .leftJoinAndSelect('comments.customer', 'customer');

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString =await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(customer.name ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substrisng search
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

  async findOne(id: string){
    const Comment = await this.commentRepository.findOne({ where: { id: id } });
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


  // Update a department by ID
  async update(id: string, updateCommentDto: UpdateCommentDto) {
    await this.findOne(id);
    await this.commentRepository.update(id, updateCommentDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const Comment = await this.findOne(id);
    await this.commentRepository.remove(Comment);
  }
}
