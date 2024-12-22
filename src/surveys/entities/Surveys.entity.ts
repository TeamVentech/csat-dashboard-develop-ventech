import { Exclude, Expose } from 'class-transformer';
import { QRCodes } from '../../qrcode/entities/qrCodes.entity';
import { SubCategory } from '../../sub-categories/entities/subcategories.entity';
import { User } from '../../users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, PrimaryColumn, Index } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('surveys')
export class Surveys {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  state: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column()
  brief: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => QRCodes, qrCodes => qrCodes.survey)
  survey: QRCodes[];
}
