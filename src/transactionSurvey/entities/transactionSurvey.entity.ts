import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../customers/entities/customers.entity';
import { Surveys } from '../../surveys/entities/Surveys.entity';

@Entity('transaction_survey')
@Index('idx_category_touchpoint', ['categoryId', 'touchPointId'])
@Index('idx_customer_gender_age', ['customerId'])
@Index('idx_created_at', ['createdAt']) // For time range filtering
@Index('idx_survey_touchpoint', ['surveyId', 'touchPointId']) // Add asn indsexf
export class TransactionSurvey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  state: string;

  @Column({ default: 'Customer' })
  addedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  answers: Array<{
    type: string;
    question: Record<string, any>;
    choices: string;
    rate: string;
    answer: any;
  }>;

  @Column({ default: "5" })
  rating: string;


  @PrimaryColumn({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @PrimaryColumn({ name: 'survey_id', type: 'uuid' })
  surveyId: string;

  @ManyToOne(() => Surveys, { eager: true })
  @JoinColumn({ name: 'survey_id' })
  survey: Surveys;

  @PrimaryColumn({ name: 'touchpoint_id', type: 'uuid' })
  touchPointId: string;

  @PrimaryColumn({ name: 'category_id', type: 'uuid' })
  categoryId: string;
}