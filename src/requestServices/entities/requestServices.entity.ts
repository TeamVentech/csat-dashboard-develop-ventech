import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('request-services')
export class RequestServices {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  state: string;

  @Column({ nullable: true })
  rating: string;

  @Column({ nullable: true })
  addedBy: string;

  @Column({ nullable: true, default:"" })
  actions: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'service_id', unique: true })
  serviceId: string;

  @BeforeInsert()
  generateCustomId() {
    const prefix = 'LC';
    const year = new Date().getFullYear().toString(); // Current yearff
    const numericPart = parseInt(this.id.split('-')[0], 16) % 1000; // Extract a numeric part from the UUID
    const formattedNumber = numericPart.toString().padStart(3, '0'); // Ensure it's 3 digits
    this.serviceId = `#${prefix}${year}-${formattedNumber}`;
  }

  isExpiringSoon(): boolean {
    if (this.name === 'Gift Voucher Sales' && this.metadata?.Expiry_date) {
      const expiryDate = new Date(this.metadata.Expiry_date);
      const currentDate = new Date();
      const diffInDays = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffInDays === 7;
    }
    return false;
  }

}
