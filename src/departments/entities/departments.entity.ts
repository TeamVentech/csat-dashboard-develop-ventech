import { User } from '../../users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ unique: true })
  name: string;

  @OneToMany(() => User, (user) => user.department)
  users: User[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'department_head_id' })
  departmentHead: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
