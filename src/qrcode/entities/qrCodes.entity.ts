import { SubCategory } from '../../sub-categories/entities/subcategories.entity';
import { Surveys } from '../../surveys/entities/Surveys.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('qrcodes')
export class QRCodes {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  qr_code_identifier: string;
  
  @Column({ nullable: true})
  image: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Surveys, survey => survey.survey)
  survey: Surveys;

  @Column()
  surveyId: string;

}
