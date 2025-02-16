import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb', nullable: true, unique: true })
  name: any;

  @Column({ type: 'varchar', length: 255, default: "parking" })
  type: string;

  @Column({ default: "0" })
  rating: string;

  @Column({ default: "survey" })
  species: string;

  @Column({ default: "0" })
  counted: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  complaint_type: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
