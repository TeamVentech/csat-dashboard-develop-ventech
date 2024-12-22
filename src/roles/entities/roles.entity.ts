import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AbilityDto } from '../dto/ability.dto';

@Entity('roles')
export class Role {
  @PrimaryColumn({ unique: true })
  name: string;

  @Column('json', { nullable: true })
  ability: AbilityDto[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
