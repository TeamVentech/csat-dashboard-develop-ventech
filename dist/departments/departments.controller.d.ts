import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create.dto';
import { UpdateDepartmentDto } from './dto/update.dto';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    create(createDepartmentDto: CreateDepartmentDto): Promise<import("./entities/departments.entity").Department>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        categories: import("./entities/departments.entity").Department[];
        total: number;
    }>;
    find(): Promise<import("./entities/departments.entity").Department[]>;
    findOne(id: string): Promise<import("./entities/departments.entity").Department>;
    update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<import("./entities/departments.entity").Department>;
    remove(id: string): Promise<void>;
}
