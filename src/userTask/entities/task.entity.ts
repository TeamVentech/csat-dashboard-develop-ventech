import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tasks')
export class Tasks {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @Column({nullable: true})
  complaintId: string;


  @Column({nullable: true})
  type: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', default: [] })  
  assignedTo: any[];

  @Column({ default: 'Pending' })
  status: string;

  @Column({ type: 'jsonb' })
  actions: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
