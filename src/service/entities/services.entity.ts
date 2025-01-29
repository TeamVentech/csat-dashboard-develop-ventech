import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('services')
export class Services {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  type: string;

  @Column()
  status: string;

  @Column()
  addedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'service_id', unique: true })
  serviceId: string;

  @BeforeInsert()
  generateCustomId() {
    const prefix = 'AS';
    const year = new Date().getFullYear().toString();
    const month = new Date().getMonth().toString()
    const day = new Date().getDay().toString()
    const time = new Date().getTime().toString()
    this.serviceId = `#${prefix}-${year}${month}${day}-${time}`;

  }
}
