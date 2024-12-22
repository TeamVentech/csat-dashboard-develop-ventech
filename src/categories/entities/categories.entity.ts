import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SubCategory } from '../../sub-categories/entities/subcategories.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4(); // Generate UUID using the uuid package

  @Column({ type: 'jsonb', nullable: true })
  name: any;

  @Column({ type: 'varchar', length: 255, default:"parking" })
  type: string;

  @Column({ default: "0" })
  rating: string;

  @Column({ default: "0" })
  counted: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => SubCategory, (subCategory) => subCategory.category)
  subcategories: SubCategory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
