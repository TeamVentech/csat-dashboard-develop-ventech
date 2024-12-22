import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, ManyToOne } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Department } from '../../departments/entities/departments.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  username: string;

  @Column({ default: "admin" })
  role: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'phone_number', length: 15, nullable: true })
  phoneNumber: string;

  @ManyToOne(() => Department, (department) => department.users)
  department: Department;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
