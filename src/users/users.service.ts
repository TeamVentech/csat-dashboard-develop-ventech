import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create.dto';
import { UpdateUserDto } from './dto/update.dto';
@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>
  ) {}

  // Create a new user
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  // Get all users with pagination and filtering
  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
  
    const queryBuilder = this.userRepository.createQueryBuilder('user');
  
    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        queryBuilder.andWhere('(user.email ILIKE :search OR user.username ILIKE :search OR user.role ILIKE :search OR user.phone_number ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });
      }
      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }
  
    const [categories, total] = await queryBuilder
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();
  
    return { categories, total };
  }
    // Get a single user by ID
  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findOneByEmail(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email: id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Update a user by ID
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id); // Check if the user exists
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id); // Return the updated user
  }

  async getUsersByRoles(roles: string[]): Promise<User[]> {
    return this.userRepository.find({ where: { role: In(roles) } });
  }
  // Delete a user by ID
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id); // Check if the user exists
    await this.userRepository.remove(user);
  }

  async findOneLog(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user;
  }
}
