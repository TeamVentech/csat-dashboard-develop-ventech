import { DataSource } from 'typeorm';
import { Tasks } from './entities/task.entity';

export const TasksProvider = [
  {
    provide: 'TASK_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Tasks),
    inject: ['DATA_SOURCE'],
  },
];
