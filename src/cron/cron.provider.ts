import { DataSource } from 'typeorm';
import { Tasks } from 'userTask/entities/task.entity';
// import { Tasks } from './entities/requestServices.entity';

export const CronProvider = [
  {
    provide: 'TASK_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Tasks),
    inject: ['DATA_SOURCE'],
  },
];
