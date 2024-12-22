import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create.dto';
import { UpdateUserDto } from './dto/update.dto';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        categories: User[];
        total: number;
    }>;
    findOne(id: string): Promise<User>;
    findOneByEmail(id: string): Promise<User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: string): Promise<void>;
    findOneLog(email: string): Promise<User | undefined>;
}
