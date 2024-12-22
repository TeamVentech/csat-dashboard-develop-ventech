import { Department } from '../../departments/entities/departments.entity';
export declare class User {
    id: string;
    username: string;
    role: string;
    email: string;
    password: string;
    phoneNumber: string;
    department: Department;
    createdAt: Date;
    updatedAt: Date;
    hashPassword(): Promise<void>;
}
