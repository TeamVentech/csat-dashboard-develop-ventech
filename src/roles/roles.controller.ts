import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create.dto';
import { UpdateRoleDto } from './dto/update.dto';
import { AuthGuard } from '@nestjs/passport';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('roles')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('Admin::write')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Permissions('Admin::read')
  findAll(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
  ) {
    return this.rolesService.findAll(page, perPage);
  }

  @Get('role/all')
  find() {
    return this.rolesService.find();
  }

  @Get(':name')
  @Permissions('Admin::read')
  findOne(@Param('name') name: string) {
    return this.rolesService.findOne(name);
  }

  @Patch(':name')
  @Permissions('Admin::update')
  update(@Param('name') name: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(name, updateRoleDto);
  }

  

  @Delete(':id')
  @Permissions('Admin::delete')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
