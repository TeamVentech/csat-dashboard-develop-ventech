import { User } from '../../users/entities/user.entity';
export declare class Department {
    id: string;
    name: string;
    users: User[];
    departmentHead: User;
    createdAt: Date;
    updatedAt: Date;
}
