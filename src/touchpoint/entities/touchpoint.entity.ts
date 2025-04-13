import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Category } from 'categories/entities/categories.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('touchpoints')
@Unique(['name', 'categoryId'])  // Enforce unique constraint on name and categoryId
export class Touchpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ type: 'jsonb', nullable: true })
  name: any;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: "0" })
  rating: string;

  @Column({ default: 0 })
  countTransaction: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: {
    "First_Level": "",
    "Final_Level": "",
    "GM": "",
    "CX_Team": "",
    "Level_1": "",
    "Level_2": "",
    "Level_3": "",
  } })
  workflow: any;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
