  import { IsIn } from 'class-validator';
  import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
  import { v4 as uuidv4 } from 'uuid';

  @Entity('tenants')
  export class Tenant {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4();

    @Column()
    name: string;

    @Column()
    contact_name: string;

    @Column()
    email: string;

    @Column({nullable:true})
    manager_account: string;

    @Column({nullable:true})
    manager_email: string;

    @Column()
    phone_number: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
