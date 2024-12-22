import { Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,

 } from '@nestjs/common';
import { RequestServicesService } from './requestServices.service';
import { CreateRequestServicesDto } from './dto/create.dto';
import { UpdateRequestServicesDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('request-services')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class RequestServicesController {
  constructor(private readonly requestServicesService: RequestServicesService) {}

  @Post()
  @Permissions('Service::write')

  create(@Body() createRequestServicesDto: any) {
    return this.requestServicesService.create(createRequestServicesDto);
  }

  @Get()
  @Permissions('Service::read')
  findAll(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search?: string,
  ) {
    const filterOptions = {
      search
  };
    return this.requestServicesService.findAll(page, perPage, filterOptions);
  }

  @Get(':id')
  @Permissions('Service::read')

  findOne(@Param('id') id: string) {
    return this.requestServicesService.findOne(id);
  }

  @Get('type/:type')
  @Permissions('Service::read')
  findType(@Param('type') type: string) {
    return this.requestServicesService.findType(type);
  }

  @Patch(':id')
  @Permissions('Service::update')

  update(@Param('id') id: string, @Body() updateRequestServicesDto: UpdateRequestServicesDto) {
    return this.requestServicesService.update(id, updateRequestServicesDto);
  }

  @Delete(':id')
  @Permissions('Service::delete')

  remove(@Param('id') id: string) {
    return this.requestServicesService.remove(id);
  }
}
