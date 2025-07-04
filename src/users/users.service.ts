import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create.dto';
import { UpdateUserDto } from './dto/update.dto';
import {  FilesS3Service } from 'azure-storage/aws-storage.service';
import { PhoneValidator } from '../utils/phone-validator.util';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
    private readonly filesAzureService: FilesS3Service, // Inject TouchPointsSegrvice

  ) {}

  // Create a new user
  async create(createUserDto: CreateUserDto, file): Promise<User> {
    let avatarUrl = null;

    // Check if the email already exists
    const existingUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    }

    // Check if the phone number already exists
    if (createUserDto.phoneNumber) {
      createUserDto.phoneNumber = PhoneValidator.formatPhoneNumber(createUserDto.phoneNumber);
    }

    // Upload file to Azure if avatar exists
    if (file) {
      avatarUrl = await this.filesAzureService.uploadFile(file, "users");
    }
    if(createUserDto.username){
      createUserDto.username = createUserDto.username.toLowerCase()
    }
    if(createUserDto.email){
      createUserDto.email = createUserDto.email.toLowerCase()
    }
    const user = this.userRepository.create({
      ...createUserDto,
      avatar: avatarUrl, // Store the uploaded file URL in the avatar field
    });

    return this.userRepository.save(user);
  }

  async updateUserAvatar(id: string, file: any) {
    // Upload the file to Azure and get the file URL
    const avatarUrl = await this.filesAzureService.uploadFile(file, "users");

    await this.userRepository.update(id, { avatar: avatarUrl });

    return { message: 'Avatar updated successfully', avatar: avatarUrl };
  }

  // Get all users with pagination and filtering
  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = await filterOptions.search.startsWith(' ')
        ? filterOptions.search.replace(' ', '+')
        : filterOptions.search;
      filterOptions.search = searchString
        queryBuilder.andWhere('("user"."email" ILIKE :search OR "user"."username" ILIKE :search OR "user"."role" ILIKE :search OR "user"."phone_number" ILIKE :search OR "user"."id"::text ILIKE :search)', {
          search: `%${filterOptions.search}%`, // Use wildcards for substring search
        });
      }
      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`"user"."${key}" = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }
	queryBuilder.orderBy('user.createdAt', 'DESC');

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

  async findOneByPhoneNumber(phoneNumber: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { phoneNumber: phoneNumber } });
    if (!user) {
      throw new NotFoundException(`User with ID ${phoneNumber} not found`);
    }
    return user;
  }
  // Update a user by ID
  async update(id: string, updateUserDto: UpdateUserDto, file): Promise<User> {
    let avatarUrl = null;

    // Check if email is being updated and if it already exists for another user
    if (updateUserDto.email) {
      const existingUser = await this.userRepository.findOne({ where: { email: updateUserDto.email.toLowerCase() } });
      if (existingUser && existingUser.id !== id) {
        throw new HttpException('Email already exists for another user', HttpStatus.CONFLICT);
      }
    }

    // Check if phone number is being updated and if it already exists for another user
    if (updateUserDto.phoneNumber) {
      const existingUserPhone = await this.userRepository.findOne({ where: { phoneNumber: updateUserDto.phoneNumber } });
      if (existingUserPhone && existingUserPhone.id !== id) {
        throw new HttpException('Phone number already exists for another user', HttpStatus.CONFLICT);
      }
    }

    if (file) {
      updateUserDto.avatar = await this.filesAzureService.uploadFile(file, "users");
    }
    if(updateUserDto.username){
      updateUserDto.username = updateUserDto.username.toLowerCase()
    }
    if(updateUserDto.email){
      updateUserDto.email = updateUserDto.email.toLowerCase()
    }
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async getUsersByRoles(roles: any): Promise<User[]> {
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

  async save(user: User) {
    await this.userRepository.update(user.id ,user);
    return this.findOne(user.id);

  }

  async removeMultiple(ids: string[]) {
    const results = [];

    for (const id of ids) {
      try {
        const user = await this.findOne(id);
        await this.userRepository.remove(user);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, message: error.message });
      }
    }

    return {
      message: 'Users deletion completed',
      results
    };
  }

}
