import { Controller, Get, Post, Body, Patch, Param, Delete, Query,  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
 } from '@nestjs/common';
import { TouchPointsService } from './touch-points.service';
import { CreateTouchPointDto } from './dto/create.dto';
import { UpdateTouchPointDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('touchpoints')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)

export class TouchPointsController {
  constructor(private readonly touchpointsService: TouchPointsService) {}

  @Post()
  @Permissions('Lookups::write')
  create(@Body() createTouchPointDto: any) {
    return this.touchpointsService.create(createTouchPointDto);
  }

  @Get('grouped-by-category/:type')
  async getTouchpointsGroupedByCategory(@Param('type') type: string) {
    return this.touchpointsService.getTouchpointsGroupedByCategory(type);
  }

  @Get()
  @Permissions('Lookups::read')
  findAll(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('filter') filter: string = '',
  ) {
    return this.touchpointsService.findAll(page, perPage, filter);
  }


  @Get('search/all')
  findAllSearch(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('filter') filter: string = '',
    @Query('type') type: string = '',
  ) {
    return this.touchpointsService.findAllSearch(page, perPage, filter, type);
  }

  @Get('touchpoint/all')
  findAllCategory(
  ) {

    return this.touchpointsService.findAllCategory();
  }

  @Get(':id')
  @Permissions('Lookups::read')
  findOne(@Param('id') id: string) {
    return this.touchpointsService.findOne(id);
  }

  @Get('category/:id')
  @Permissions('Lookups::read')
  findByCategory(@Param('id') id: string) {
    return this.touchpointsService.findByCategory(id);
  }


  @Get('/rating/high')
  findHLRating() {
    return this.touchpointsService.findHighestRated();
  }

  @Get('/rating/low')
  findLowestRated() {
    return this.touchpointsService.findLowestRated();
  }

  @Patch(':id')
  @Permissions('Lookups::update')
  update(@Param('id') id: string, @Body() updateTouchPointDto: any) {
    return this.touchpointsService.update_touchpoint(id, updateTouchPointDto);
  }

  @Delete(':id')
  @Permissions('Lookups::delete')
  remove(@Param('id') id: string) {
    return this.touchpointsService.remove(id);
  }
}
