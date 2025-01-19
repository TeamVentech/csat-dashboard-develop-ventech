import { Department } from 'departments/entities/departments.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ unique: true })
  name: string;

  @Column('json', { nullable: true })
  role: any[];

  @PrimaryColumn({ name: 'department_id', type: 'uuid' })
  departmentId: string;

  @ManyToOne(() => Department, { eager: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
