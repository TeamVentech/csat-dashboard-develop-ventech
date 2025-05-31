import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create.dto';
import { UpdateCommentDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('comments')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class CommentController {
  constructor(private readonly requestServicesService: CommentService) {}

  @Post()
  @Permissions('Customer Care Center::write')
  create(@Body() createCommentDto: any) {
    return this.requestServicesService.create(createCommentDto);
  }

  @Get()
  @Permissions('Customer Care Center::read')
  findAll(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search?: string,
    @Query('state') state?: string,
  ) {
    const filterOptions = {
      search,
    };
    return this.requestServicesService.findAll(
      page,
      perPage,
      filterOptions,
      state,
    );
  }

  @Get(':id')
  @Permissions('Customer Care Center::read')
  findOne(@Param('id') id: string) {
    return this.requestServicesService.findOne(id);
  }

  // @Get('type/:type')
  // @Permissions('Service::read')
  // findType(@Param('type') type: string) {
  //   return this.requestServicesService.findType(type);
  // }

  @Patch(':id')
  @Permissions('Customer Care Center::update')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.requestServicesService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @Permissions('Customer Care Center::delete')
  remove(@Param('id') id: string) {
    const ids = id.split(',');
    return this.requestServicesService.removeMultiple(ids);
  }
}
