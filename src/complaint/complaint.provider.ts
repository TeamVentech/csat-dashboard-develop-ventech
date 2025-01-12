import { DataSource } from 'typeorm';
import { Complaints } from './entities/complaint.entity';

export const ComplaintsProvider = [
  {
    provide: 'COMPLAINT_SERVICES_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Complaints),
    inject: ['DATA_SOURCE'],
  },
];
