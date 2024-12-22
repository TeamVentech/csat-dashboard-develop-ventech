  import { IsIn } from 'class-validator';
  import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
  import { v4 as uuidv4 } from 'uuid';


  @Entity('corporates')
  export class Corporate {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4();

    @Column()
    name: string;

    @Column({ length: 15, unique: true })
    phone_number: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    address: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
