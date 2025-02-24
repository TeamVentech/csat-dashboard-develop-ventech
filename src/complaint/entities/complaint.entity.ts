import { Category } from 'categories/entities/categories.entity';
import { Exclude } from 'class-transformer';
import { Customer } from 'customers/entities/customers.entity';
import { Tenant } from 'tenants/entities/tenants.entity';
import { Touchpoint } from 'touchpoint/entities/touchpoint.entity';
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

  @Column({ default:"Open"})
  status: string;

  @Column({ nullable: true })
  addedBy: string;

  @Exclude()
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Exclude()
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // @Column({ type: 'jsonb' })
  // customer: any;

  // @Column({  type: 'jsonb' })s
  // category: any;

  @Exclude()
  @PrimaryColumn({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  // @Column({  type: 'jsonb' })
  // touchpoint: any;

  @Exclude()
  @PrimaryColumn({ name: 'touchpoint_id', type: 'uuid' })
  touchpointId: string;

  @ManyToOne(() => Touchpoint)
  @JoinColumn({ name: 'touchpoint_id' })
  touchpoint: Touchpoint;

  @Column({ type: 'jsonb',nullable: true })
  sections: any;  

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'complaint_id', unique: true })
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
