import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  UploadedFile
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create.dto';
import { UpdateUserDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService  ) {
    
   }

  @Post()
  @UseInterceptors(FileInterceptor('file')) // Intercept file upload
  @Permissions('Admin::write')
  create(@Body() createUserDto: CreateUserDto,  @UploadedFile() file: Express.Multer.File) {
    return this.usersService.create(createUserDto, file);
  }

  @Post('upload/:id')
  async uploadAvatar(@Param('id') id: string, @Body() url: string) {
    if (!url) {
      throw new Error('url is required');
    }
    return this.usersService.updateUserAvatar(id, url);
  }

  @Get('by-roles')
  async getUsersByRoles(@Query('roles') roles: string) {
    const rolesArray = JSON.parse(roles);
    return this.usersService.getUsersByRoles(rolesArray);
  }

  @Get()
  @Permissions('Admin::read')
  findAll(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('email') email?: string,
    @Query('search') search?: string, // Accepting search query
    @Query('username') username?: string,
  ) {
    const filterOptions = {
      email,
      username,
      search
    };
    return this.usersService.findAll(page, perPage, filterOptions);
  }

  @Get(':id')
  @Permissions('Admin::read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('Admin::update')
  @UseInterceptors(FileInterceptor('file')) // Intercept file upload
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto,  @UploadedFile() file: Express.Multer.File) {
    return this.usersService.update(id, updateUserDto, file);
  }

  @Delete(':id')
  @Permissions('Admin::delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
