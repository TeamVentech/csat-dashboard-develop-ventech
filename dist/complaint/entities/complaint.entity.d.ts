import { Category } from 'categories/entities/categories.entity';
import { Customer } from 'customers/entities/customers.entity';
export declare class Complaints {
    id: string;
    name: string;
    type: string;
    state: string;
    addedBy: string;
    customerId: string;
    customer: Customer;
    categoryId: string;
    category: Category;
    metadata: any;
    touchpointId: string;
    createdAt: Date;
    updatedAt: Date;
    complaintId: string;
    generateCustomId(): void;
}
