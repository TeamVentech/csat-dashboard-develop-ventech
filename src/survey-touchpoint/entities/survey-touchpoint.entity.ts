import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('survey_touchpoints')
export class SurveyTouchpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  surveyId: string;

  @Column()
  qrcodeLink: string;

  @Column()
  touchpointName: string;

  @Column()
  qrImage: string;

  @Column()
  touchpointId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 