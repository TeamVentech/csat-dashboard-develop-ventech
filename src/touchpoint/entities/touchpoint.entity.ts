import { Category } from 'categories/entities/categories.entity';
import { Location } from 'locations/entities/Locations.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, PrimaryColumn, JoinColumn, ManyToOne } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('touchpoints')
export class Touchpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ type: 'jsonb', nullable: true, unique: true  })
  name: any;

  @Column({default:"0"})
  rating: string;

  @Column({default: 0})
  countTransaction: number;

  @Column({ type: 'text', nullable: true })
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
