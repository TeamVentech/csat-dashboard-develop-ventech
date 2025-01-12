import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('vouchers')
export class Vouchers {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  name: string;

  @Column({ default:"Pending"})
  state: string;

  @Column({nullable: true})
  addedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'service_id', unique: true })
  VoucherId: string;

  @Column({ name: 'serial_number', unique: true })
  serialNumber: string;

  @BeforeInsert()
  generateCustomId() {
    const prefix = 'VO';
    const year = new Date().getFullYear().toString(); // Current years
    const month = new Date().getMonth().toString() // Current years
    const day = new Date().getDay().toString() // Current years
    const time = new Date().getTime().toString() // Current years
    this.VoucherId = `#${prefix}-${year}${month}${day}-${time}`;

  }
}
