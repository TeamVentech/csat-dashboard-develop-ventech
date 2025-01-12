import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SubCategory } from '../../sub-categories/entities/subcategories.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('complaint_categories')
export class ComplaintCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ type: 'jsonb', nullable: true })
  name: any;

  @Column({ default: "0" })
  rating: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
