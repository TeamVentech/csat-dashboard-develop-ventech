import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { SectionsService } from './Sections.service';
import { CreateSectionDto } from './dto/create.dto';
import { UpdateSectionDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('sections')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)

export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) { }

  @Post()
  @Permissions('Lookups::write')
  create(@Body() createSectionDto: CreateSectionDto) {
    return this.sectionsService.create(createSectionDto);
  }

  @Get()
  @Permissions('Lookups::read')
  findAll(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search?: string,
  ) {
    const filterOptions = {
      search
    };
    return this.sectionsService.findAll(page, perPage, filterOptions);
  }

  @Get(':id')
  @Permissions('Lookups::read')
  findOne(@Param('id') id: string) {
    return this.sectionsService.findOne(id);
  }

  @Get('find/all')
  findallwithoutfilter() {
    return this.sectionsService.findallwithoutfilter();
  }

  @Get('sections/all')
  findAllCategory(
  ) {

    return this.sectionsService.findAllSections();
  }
  @Patch(':id')
  @Permissions('Lookups::update')
  update(@Param('id') id: string, @Body() updateSectionDto: UpdateSectionDto) {
    return this.sectionsService.update(id, updateSectionDto);
  }

  @Delete(':id')
  @Permissions('Lookups::delete')
  remove(@Param('id') id: string) {
    return this.sectionsService.remove(id);
  }
}
