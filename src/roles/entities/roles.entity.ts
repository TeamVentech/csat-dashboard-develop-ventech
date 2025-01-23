import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { AbilityDto } from '../dto/ability.dto';
import { Section } from 'section/entities/Sections.entity';

@Entity('roles')
export class Role {
  @PrimaryColumn({ unique: true })
  name: string;

  @Column('json', { nullable: true })
  ability: AbilityDto[];

  @ManyToMany(() => Section, (section) => section.role)
  sections: Section[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
