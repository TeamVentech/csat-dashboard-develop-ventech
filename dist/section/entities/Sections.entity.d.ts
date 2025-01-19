import { Department } from 'departments/entities/departments.entity';
export declare class Section {
    id: string;
    name: string;
    role: any[];
    departmentId: string;
    department: Department;
    createdAt: Date;
    updatedAt: Date;
}
