import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tasks } from './entities/task.entity';
import { CreateTaskDto } from './dto/create.dto';
import { UpdateTaskServicesDto } from './dto/update.dto';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';

@Injectable()
export class TasksService {
  constructor(
    @Inject('TASK_REPOSITORY')
    private readonly tasksRepository: Repository<Tasks>,
    private readonly elasticService: ElasticService,
  ) {}

  async create(createTasksDto: CreateTaskDto) {
    console.log('createTasksDto')
    console.log(createTasksDto)
    const data = this.tasksRepository.create(createTasksDto);
    console.log(data)
    const task = await this.tasksRepository.save(data);
    await this.elasticService.indexData('tasks', task.id, task);

  }

  async findOne(id: string) {
    const RequestServices = await this.elasticService.getById('tasks', id);
    if (!RequestServices) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return RequestServices.data;
  }

  // Update a task by ID
  async update(id: string, updateTasksDto: UpdateTaskServicesDto) {
    await this.findOne(id);
    await this.tasksRepository.update(id, updateTasksDto);
    await this.elasticService.updateDocument('tasks', id, updateTasksDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const Tasks = await this.findOne(id);
    // await this.tasksRepository.remove(Tasks);
  }
}
