import { SubCategory } from '../../sub-categories/entities/subcategories.entity';
export declare class Category {
    id: string;
    name: any;
    type: string;
    rating: string;
    counted: string;
    description: string;
    subcategories: SubCategory[];
    createdAt: Date;
    updatedAt: Date;
}
