/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('locations')
@Unique(['tenant', 'floor'])
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string =  uuidv4();

  @Column()
  floor: string;

  @Column()
  tenant: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
