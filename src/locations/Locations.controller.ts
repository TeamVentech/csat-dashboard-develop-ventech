import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { LocationsService } from './Locations.service';
import { CreateLocationDto } from './dto/create.dto';
import { UpdateLocationDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('locations')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)

export class LocationsController {
  constructor(private readonly LocationsService: LocationsService) { }

  @Post()
  @Permissions('Lookups::write')
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.LocationsService.create(createLocationDto);
  }

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search?: string,
  ) {
    const filterOptions = {
      search
    };
    return this.LocationsService.findAll(page, perPage, filterOptions);
  }

  @Get(':id')
  @Permissions('Lookups::read')
  findOne(@Param('id') id: string) {
    return this.LocationsService.findOne(id);
  }

  @Get('locations/all')
  findAllLocation() {
    return this.LocationsService.findAllLocation();
  }

  @Patch(':id')
  @Permissions('Lookups::update')
  update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
    return this.LocationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @Permissions('Lookups::delete')
  remove(@Param('id') id: string) {
    const ids = id.split(',');
    return this.LocationsService.removeMultiple(ids);
  }
}
