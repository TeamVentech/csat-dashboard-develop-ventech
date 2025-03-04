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
    // Define prefix mapping based on type
    const prefixMap: Record<string, string> = {
      'Lost Child': 'LC',
      'Found Child': 'FC',
      'Lost Item': 'LF',
      'Complaints': 'CMP',
      'Suggestion Box': 'SUG',
      'Comments': 'CMT',
      'Corporate Voucher Sale': 'GVS-C',
      'Individual Voucher Sale': 'GVS-I',
      'Wheelchair & Stroller Request': 'WC',
      'Power Bank Request': 'PB',
      'Handsfree Request': 'HF',
      'Incident Reporting': 'INC',
      'Surveys': 'SRV'
    };
  
    const prefix = prefixMap[this.type] || 'UNKNOWN';

    // Get current date in YYYYMMDD format
    const now = new Date();
    const formattedDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  
    // Generate a 4-digit sequential number based on UUID
    const numericPart = parseInt(this.id.split('-')[0], 16) % 10000; // Ensure it's 4 digits
    const formattedNumber = numericPart.toString().padStart(4, '0');
  
    // Final service ID format
    this.serviceId = `${prefix}-${formattedDate}-${formattedNumber}`;
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
