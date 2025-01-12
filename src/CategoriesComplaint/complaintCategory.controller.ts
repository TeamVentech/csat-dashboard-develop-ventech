import {
  Controller, Get, Post, Body, Param, Delete, Put, Query, 
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { ComplaintCategoryService } from './complaintCategory.service';
import { CreateComplaintCategoryDto } from './dto/create.dto';
import { UpdateComplaintCategoryDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('complaintCategory')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)

export class CategoriesController {
  constructor(private readonly complaintCategoryService: ComplaintCategoryService) { }

  @Post()
  @Permissions('complaint::write')
  async create(@Body() createComplaintCategoryDto: CreateComplaintCategoryDto) {
    return this.complaintCategoryService.create(createComplaintCategoryDto);
  }

  @Get()
  @Permissions('Survey::read')
  findAll(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search?: string,
  ) {
    const filterOptions = {
      search
    };
    return this.complaintCategoryService.findAll(page, perPage, filterOptions);
  }


  @Get('complaintCategory/all')
  findAllComplaintCategory(
  ) {

    return this.complaintCategoryService.findAllComplaintCategory();
  }

  @Get(':id')
  @Permissions('Survey::read')

  async findOne(@Param('id') id: string) {
    return this.complaintCategoryService.findOne(id);
  }

  @Put(':id')
  @Permissions('Survey::update')

  async update(@Param('id') id: string, @Body() updateComplaintCategoryDto: UpdateComplaintCategoryDto) {
    return this.complaintCategoryService.update(id, updateComplaintCategoryDto);
  }

  @Delete(':id')
  @Permissions('Survey::delete')

  async remove(@Param('id') id: string) {
    return this.complaintCategoryService.remove(id);
  }
}
