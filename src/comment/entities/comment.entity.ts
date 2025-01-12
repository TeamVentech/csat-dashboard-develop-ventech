import { Category } from 'categories/entities/categories.entity';
import { Customer } from 'customers/entities/customers.entity';
import { Surveys } from 'surveys/entities/Surveys.entity';
import { Touchpoint } from 'touchpoint/entities/touchpoint.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  message: String


  @Column({ default: "comment" })
  type: String

  @Column({ type: 'jsonb', default: {}, nullable: true })
  metadata: any;


  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, { nullable: false })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'touchpoint_id', type: 'uuid' })
  touchpointId: string | null;

  @Column({ name: 'touchpoint_name', type: 'json', nullable: true })
  touchpointName: any;
  // @ManyToOne(() => Touchpoint, { nullable: true })
  // @JoinColumn({ name: 'touchpoint_id' })
  // touchpoint: Touchpoint | null;

  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId: string;

  @ManyToOne(() => Surveys, { nullable: false })
  @JoinColumn({ name: 'survey_id' })
  survey: Surveys;

  @Column({ type: 'varchar', length: 255 })
  status: string;

  @CreateDateColumn({ name: 'submission_date' })
  submissionDate: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
