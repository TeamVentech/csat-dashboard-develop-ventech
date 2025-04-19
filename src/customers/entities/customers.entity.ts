  import { IsIn } from 'class-validator';
  import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
  import { v4 as uuidv4 } from 'uuid';

  export enum Gender {
    Male = 'Male',
    Female = 'Female',
  }

  @Entity('customers')
  export class Customer {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4();

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    age: string;

    @Column({ length: 15, unique: true })
    phone_number: string;

    @Column({ unique: true, nullable: true })
    email: string;

    @Column({ nullable: true })
    dob: Date;

    @Column({ nullable: true })
    passport_number: string;

    @Column({ nullable: true })
    national_id: string;

    @Column({ enum: Gender, nullable: true })
    gender: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
