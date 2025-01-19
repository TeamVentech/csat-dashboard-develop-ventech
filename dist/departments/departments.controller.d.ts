import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create.dto';
import { UpdateDepartmentDto } from './dto/update.dto';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    create(createDepartmentDto: CreateDepartmentDto): Promise<import("./entities/departments.entity").Department>;
    findAll(page: number, perPage: number, search?: any): Promise<{
        totalHits: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
        results: unknown[];
    }>;
    find(): Promise<{
        data: unknown[];
        success?: undefined;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        message: string;
        data: unknown;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<{
        success: boolean;
        message: string;
        data: unknown;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    remove(id: string): Promise<{}>;
}
