import { DataSource } from 'typeorm';
import { Section } from './entities/Sections.entity';
export declare const SectionProvider: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Section>;
    inject: string[];
}[];
