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
  constructor(private readonly touchPointsService: TouchPointsService) {}

  @Post()
  @Permissions('Lookups::write')
  create(@Body() createTouchPointDto: any) {
    return this.touchPointsService.create(createTouchPointDto);
  }

  @Get()
  @Permissions('Lookups::read')
  findAll(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('filter') filter: string = '',
  ) {
    return this.touchPointsService.findAll(page, perPage, filter);
  }

  @Get('touchpoint/all')
  findAllCategory(
  ) {

    return this.touchPointsService.findAllCategory();
  }

  @Get(':id')
  @Permissions('Lookups::read')
  findOne(@Param('id') id: string) {
    return this.touchPointsService.findOne(id);
  }

  @Get('category/:id')
  @Permissions('Lookups::read')
  findByCategory(@Param('id') id: string) {
    return this.touchPointsService.findByCategory(id);
  }


  @Get('/rating/high')
  findHLRating() {
    return this.touchPointsService.findHighestRated();
  }

  @Get('/rating/low')
  findLowestRated() {
    return this.touchPointsService.findLowestRated();
  }


  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateTouchPointDto: UpdateTouchPointDto) {
  //   return this.touchPointsService.update(id, updateTouchPointDto);
  // }

  @Patch(':id')
  @Permissions('Lookups::update')
  update(@Param('id') id: string, @Body() updateTouchPointDto: UpdateTouchPointDto) {
    return this.touchPointsService.updaterochpoint(id, updateTouchPointDto);
  }

  @Delete(':id')
  @Permissions('Lookups::delete')
  remove(@Param('id') id: string) {
    return this.touchPointsService.remove(id);
  }
}
