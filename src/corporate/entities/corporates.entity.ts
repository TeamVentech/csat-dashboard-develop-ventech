  import { IsIn } from 'class-validator';
  import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
  import { v4 as uuidv4 } from 'uuid';


  @Entity('corporates')
  export class Corporate {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4();

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    phone_number: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    contact_name: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
