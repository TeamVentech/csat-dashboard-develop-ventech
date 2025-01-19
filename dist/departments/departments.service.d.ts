import { Repository } from 'typeorm';
import { Department } from './entities/departments.entity';
import { CreateDepartmentDto } from './dto/create.dto';
import { UpdateDepartmentDto } from './dto/update.dto';
import { ElasticService } from 'ElasticSearch/elasticsearch.service';
export declare class DepartmentsService {
    private readonly departmentRepository;
    private readonly elasticService;
    constructor(departmentRepository: Repository<Department>, elasticService: ElasticService);
    create(createDepartmentDto: CreateDepartmentDto): Promise<Department>;
    findAll(page: any, perPage: any, search: any): Promise<{
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
