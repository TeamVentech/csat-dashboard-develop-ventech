import { Repository } from 'typeorm';
import { Role } from './entities/roles.entity';
import { CreateRoleDto } from './dto/create.dto';
import { UpdateRoleDto } from './dto/update.dto';
export declare class RolesService {
    private readonly roleRepository;
    constructor(roleRepository: Repository<Role>);
    create(createRoleDto: CreateRoleDto): Promise<Role>;
    findAll(page: number, perPage: number): Promise<{
        roles: Role[];
        total: number;
    }>;
    find(): Promise<Role[]>;
    findOne(name: string): Promise<Role>;
    findOneByName(name: string): Promise<Role>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role>;
    remove(id: string): Promise<void>;
}
