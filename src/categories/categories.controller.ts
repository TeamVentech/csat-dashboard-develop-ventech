import {
  Controller, Get, Post, Body, Param, Delete, Put, Query, 
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  UploadedFile,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create.dto';
import { UpdateCategoryDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('categories')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)

export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @UseInterceptors(FileInterceptor('file')) // Intercept file upload
  @Permissions('Survey::write')
  async create(@Body() createCategoryDto: CreateCategoryDto,  @UploadedFile() file: Express.Multer.File) {

    return this.categoriesService.create(createCategoryDto, file);
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
    return this.categoriesService.findAll(page, perPage, filterOptions);
  }


  @Get('category/all')
  findAllCategory(
  ) {

    return this.categoriesService.findAllCategory();
  }

  @Get(':id')
  @Permissions('Survey::read')

  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get('type/:type')
  @Permissions('Survey::read')
  async findByType(@Param('type') type: string) {
    return this.categoriesService.findByType(type);
  }

  @Get('complaint/type/:type')
  @Permissions('Survey::read')
  async findByComplaintType(@Param('type') type: string) {
    return this.categoriesService.findByComplaintType(type);
  }

  @Put(':id')
  @Permissions('Survey::update')

  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Permissions('Survey::delete')

  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
