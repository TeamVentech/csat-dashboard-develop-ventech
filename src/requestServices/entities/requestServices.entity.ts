import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment-timezone';

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

  @Column({ default:"0", nullable:true })
  rating: string;

  @Column({ nullable: true })
  addedBy: string;

  @Column({ nullable: true, default:"service" })
  actions: string;

  @Column({ nullable: true })
  closedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'service_id', unique: true })
  serviceId: string;

  @BeforeInsert()
  setCreatedAt() {
    // Set to current Jordan/Amman time
    this.createdAt = moment.tz(new Date(), 'Asia/Amman').toDate();
    this.updatedAt = this.createdAt;
  }

  @BeforeUpdate()
  setUpdatedAt() {
    // Set to current Jordan/Amman time
    this.updatedAt = moment.tz(new Date(), 'Asia/Amman').toDate();
  }

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
      'Wheelchair & Stroller Request': 'W-S',
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
