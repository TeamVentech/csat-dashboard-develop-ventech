import { Category } from 'categories/entities/categories.entity';
import { Customer } from 'customers/entities/customers.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, PrimaryColumn, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('complaint')
export class Complaints {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  state: string;

  @Column({ nullable: true })
  addedBy: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ name: 'touchpoint_id', type: 'uuid' })
  touchpointId: string;  

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'service_id', unique: true })
  complaintId: string;

  @BeforeInsert()
  generateCustomId() {
    const prefix = 'CO';
    const year = new Date().getFullYear().toString(); // Current years
    const month = new Date().getMonth().toString() // Current years
    const day = new Date().getDay().toString() // Current years
    const time = new Date().getTime().toString() // Current years
    // const numericPart = parseInt(this.id.split('-')[0], 16) % 1000; // Extract a numeric part from the UUID
    // const formattedNumber = numericPart.toString().padStart(5, '0'); // Ensure it's 3 digits
    this.complaintId = `#${prefix}-${year}${month}${day}-${time}`;
  }
}
