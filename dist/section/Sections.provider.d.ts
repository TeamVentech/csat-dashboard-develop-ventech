import { DataSource } from 'typeorm';
import { Section } from './entities/Sections.entity';
import { Role } from '../roles/entities/roles.entity';
export declare const SectionProvider: ({
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Section>;
    inject: string[];
} | {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Role>;
    inject: string[];
})[];
