import { Category } from '../../categories/entities/categories.entity';
import { Location } from '../../locations/entities/Locations.entity';
export declare class SubCategory {
    id: string;
    name: string;
    description: string;
    categoryId: string;
    category: Category;
    locationId: string;
    location: Location;
    createdAt: Date;
    updatedAt: Date;
}
