import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SubCategory } from '../../sub-categories/entities/subcategories.entity';
import { v4 as uuidv4 } from 'uuid';
import { Touchpoint } from 'touchpoint/entities/touchpoint.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ type: 'jsonb', nullable: true })
  name: any;

  @Column({ type: 'varchar', length: 255, default:"parking" })
  type: string;

  @Column({ default: "0" })
  rating: string;

  @Column({ default: "survey" })
  species: string;

  @Column({ default: "0" })
  counted: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
