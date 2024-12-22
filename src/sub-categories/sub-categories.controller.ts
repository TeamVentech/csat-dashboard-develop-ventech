import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryDto } from './dto/create.dto';
import { UpdateSubCategoryDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('subcategories')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)

export class SubCategoriesController {
  constructor(private readonly subCategoriesService: SubCategoriesService) { }

  @Post()
  @Permissions('Survey::write')
  create(@Body() createSubCategoryDto: CreateSubCategoryDto) {
    return this.subCategoriesService.create(createSubCategoryDto);
  }

  @Get()
  @Permissions('Survey::write')
  findAll(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('filter') filter: string = '',
  ) {
    return this.subCategoriesService.findAll(page, perPage, filter);
  }

  @Get(':id')
  @Permissions('Survey::write')
  findOne(@Param('id') id: string) {
    return this.subCategoriesService.findOne(id);
  }

  @Get('get/all')
  GetAll() {
    return this.subCategoriesService.getAll();
  }

  @Patch(':id')
  @Permissions('Survey::update')
  update(@Param('id') id: string, @Body() updateSubCategoryDto: UpdateSubCategoryDto) {
    return this.subCategoriesService.update(id, updateSubCategoryDto);
  }

  @Delete(':id')
  @Permissions('Survey::delete')
  remove(@Param('id') id: string) {
    return this.subCategoriesService.remove(id);
  }
}
