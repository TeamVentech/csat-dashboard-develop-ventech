import { Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,

 } from '@nestjs/common';
import { TasksService } from './task.service';
import { CreateTaskDto } from './dto/create.dto';
import { UpdateTaskServicesDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';

@Controller('task')
// @UseGuards(AuthGuard('jwt'), PermissionsGuard)
// @UseInterceptors(ClassSerializerInterceptor)
// @UseInterceptors(TransformInterceptor)
export class TasksController {
  constructor(private readonly tasksService: TasksService,
    private readonly elasticSearchService: ElasticService

  ) {}

  @Post()
  // @Permissions('Task::write')
  create(@Body() CreateTaskServicesDto: any) {
    return this.tasksService.create(CreateTaskServicesDto);
  }

  @Get(':id')
  // @Permissions('Service::read')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  // @Permissions('Service::update')
  update(@Param('id') id: string, @Body() UpdateTaskServicesDto: UpdateTaskServicesDto) {
    return this.tasksService.update(id, UpdateTaskServicesDto);
  }

  @Delete(':id')
  // @Permissions('Service::delete')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
  @Post('search/query')
  elasticSerchQurey(
    @Body() data: any,
  ) {
    return this.elasticSearchService.searchTask("tasks", data.search, data.page, data.perPage);
  }
}
