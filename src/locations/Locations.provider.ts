import { DataSource } from 'typeorm';
import { Location } from './entities/Locations.entity';

export const LocationProvider = [
  {
    provide: 'LOCATIONS_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Location),
    inject: ['DATA_SOURCE'],
  },
];
