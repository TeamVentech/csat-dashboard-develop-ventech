import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany, PrimaryColumn, JoinColumn } from 'typeorm';
import { Category } from '../../categories/entities/categories.entity';
import { Location } from '../../locations/entities/Locations.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('subcategories')
export class SubCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @PrimaryColumn({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @PrimaryColumn({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
