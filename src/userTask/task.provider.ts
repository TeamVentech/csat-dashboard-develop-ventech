import { DataSource } from 'typeorm';
import { Tasks } from './entities/task.entity';
import { Complaints } from 'complaint/entities/complaint.entity';

export const TasksProvider = [
  {
    provide: 'TASK_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Tasks),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'COMPLAINT_SERVICES_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Complaints),
    inject: ['DATA_SOURCE'],
  },
];
