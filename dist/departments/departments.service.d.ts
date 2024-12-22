import { Repository } from 'typeorm';
import { Department } from './entities/departments.entity';
import { CreateDepartmentDto } from './dto/create.dto';
import { UpdateDepartmentDto } from './dto/update.dto';
export declare class DepartmentsService {
    private readonly departmentRepository;
    constructor(departmentRepository: Repository<Department>);
    create(createDepartmentDto: CreateDepartmentDto): Promise<Department>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        categories: Department[];
        total: number;
    }>;
    find(): Promise<Department[]>;
    findOne(id: string): Promise<Department>;
    update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department>;
    remove(id: string): Promise<void>;
}
