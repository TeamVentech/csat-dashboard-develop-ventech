import { Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpException,
  HttpStatus,

 } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServicesDto } from './dto/create.dto';
import { UpdateServicesDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('services')
// @UseGuards(AuthGuard('jwt'), PermissionsGuard)
// @UseInterceptors(ClassSerializerInterceptor)
// @UseInterceptors(TransformInterceptor)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  // @Permissions('Stock::write')
  create(@Body() createServicesDto: any) {
    return this.servicesService.create(createServicesDto);
  }

  @Get()
  // @Permissions('Stock::read')
  findAll(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search?: string,
  ) {
    const filterOptions = {
      search
  };
    return this.servicesService.findAll(page, perPage, filterOptions);
  }

  @Get(':id')
  // @Permissions('Stock::read')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Get('type/:type')
  @Permissions('Stock::read')
  findType(@Param('type') type: string) {
    return this.servicesService.getServiceStatusCounts(type);
  }

  @Get('type/:type/status/:status')
  @Permissions('Stock::read')
  findOneByTypeStatus(@Param('type') type: string, @Param('status') status: string) {
    return this.servicesService.findOneByTypeStatus(type, status);
  }

  @Patch(':id')
  // @Permissions('Stock::update')
  update(@Param('id') id: string, @Body() updateServicesDto: UpdateServicesDto) {
    return this.servicesService.update(id, updateServicesDto);
  }

  @Delete(':id')
  // @Permissions('Stock::delete')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id); 
  }
}
