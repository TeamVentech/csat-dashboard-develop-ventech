import { AbilityDto } from '../dto/ability.dto';
import { Section } from 'section/entities/Sections.entity';
export declare class Role {
    name: string;
    ability: AbilityDto[];
    sections: Section[];
    createdAt: Date;
    updatedAt: Date;
}
