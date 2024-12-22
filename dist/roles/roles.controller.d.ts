import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create.dto';
import { UpdateRoleDto } from './dto/update.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    create(createRoleDto: CreateRoleDto): Promise<import("./entities/roles.entity").Role>;
    findAll(page: number, perPage: number): Promise<{
        roles: import("./entities/roles.entity").Role[];
        total: number;
    }>;
    find(): Promise<import("./entities/roles.entity").Role[]>;
    findOne(name: string): Promise<import("./entities/roles.entity").Role>;
    update(name: string, updateRoleDto: UpdateRoleDto): Promise<import("./entities/roles.entity").Role>;
    remove(id: string): Promise<void>;
}
