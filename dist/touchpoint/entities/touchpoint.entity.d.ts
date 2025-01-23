import { Category } from 'categories/entities/categories.entity';
export declare class Touchpoint {
    id: string;
    name: any;
    rating: string;
    countTransaction: number;
    description: string;
    categoryId: string;
    category: Category;
    createdAt: Date;
    updatedAt: Date;
}
