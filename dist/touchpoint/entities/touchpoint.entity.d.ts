import { Category } from 'categories/entities/categories.entity';
import { Location } from 'locations/entities/Locations.entity';
export declare class TouchPoint {
    [x: string]: any;
    id: string;
    name: any;
    rating: string;
    countTransaction: number;
    description: string;
    categoryId: string;
    category: Category;
    locationId: string;
    location: Location;
    createdAt: Date;
    updatedAt: Date;
}
