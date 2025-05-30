import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customers.entity';
import { CreateCustomerDto } from './dto/create.dto';
import { UpdateCustomerDto } from './dto/update.dto';
import { PhoneValidator } from '../utils/phone-validator.util';

@Injectable()
export class CustomersService {
  constructor(
    @Inject('CUSTOMERS_REPOSITORY')
    private readonly customerRepository: Repository<Customer>,
  ) { }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  async create(createCustomerDto: CreateCustomerDto){
    try {
      // Validate email format if provided
      if (createCustomerDto.email) {
        if (!this.validateEmail(createCustomerDto.email)) {
          throw new HttpException('Invalid email format', HttpStatus.BAD_REQUEST);
        }
        createCustomerDto.email = createCustomerDto.email.toLowerCase();
      }
      
      // Format phone number to include country code if needed
      if (createCustomerDto.phone_number) {
        createCustomerDto.phone_number = PhoneValidator.formatPhoneNumber(createCustomerDto.phone_number);
      }
      
      if (createCustomerDto.dob) {
        const currentYear = new Date().getFullYear();
        const DobYear = new Date(createCustomerDto.dob).getFullYear();
        createCustomerDto.age = (currentYear - DobYear).toString()
      }
      
      // Check if email or phone number already exists
      const existingCustomer = await this.doesEmailOrPhoneExist(
        createCustomerDto.email, 
        createCustomerDto.phone_number
      );
      
      if (existingCustomer) {
        // Determine which field caused the conflict
        if (existingCustomer.email && createCustomerDto.email && 
            existingCustomer.email.toLowerCase() === createCustomerDto.email.toLowerCase()) {
          throw new HttpException('Email already exists', HttpStatus.CONFLICT);
        }
        if (existingCustomer.phone_number && createCustomerDto.phone_number && 
            existingCustomer.phone_number === createCustomerDto.phone_number) {
          throw new HttpException('Phone number already exists', HttpStatus.CONFLICT);
        }
        
        throw new HttpException('Customer with this email or phone number already exists', HttpStatus.CONFLICT);
      }
      
      const customer = this.customerRepository.create(createCustomerDto);
      return this.customerRepository.save(customer);
  
    } catch (error) {
        throw new HttpException(error, HttpStatus.NOT_FOUND);
    }
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.customerRepository.createQueryBuilder('user');

    // Only return non-deleted customers
    queryBuilder.andWhere('user.isDeleted = :isDeleted', { isDeleted: false });

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('("user"."email" ILIKE :search OR "user"."name" ILIKE :search OR "user"."phone_number" ILIKE :search OR "user"."gender" ILIKE :search OR "user"."id"::text ILIKE :search OR "user"."national_id"::text ILIKE :search OR "user"."passport_number"::text ILIKE :search OR "user"."dob"::text ILIKE :search)', {
          search: `%${filterOptions.search}%`,
        });
      }
      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
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

  async findAllCustomers(filterOptions?: any){
    const queryBuilder = this.customerRepository.createQueryBuilder('user');
    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('("user"."email" ILIKE :search OR "user"."name" ILIKE :search OR "user"."phone_number" ILIKE :search OR "user"."gender" ILIKE :search OR "user"."id"::text ILIKE :search OR "user"."national_id"::text ILIKE :search OR "user"."passport_number"::text ILIKE :search OR "user"."dob"::text ILIKE :search)', {
          search: `%${filterOptions.search}%`,
        });
      }
      Object.keys(filterOptions).forEach(key => {
        if (key !== 'search' && filterOptions[key]) {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: filterOptions[key] });
        }
      });
    }
    
    queryBuilder.orderBy('user.createdAt', 'DESC');
    
    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async doesEmailOrPhoneExist(email?: string, phone_number?: string) {
    const query = this.customerRepository.createQueryBuilder('customer');

    if (email) {
      query.orWhere('customer.email = :email', { email });
    }
    if (phone_number) {
      query.orWhere('customer.phone_number = :phone_number', { phone_number });
    }

    const customer = await query.getOne();
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    await this.findOne(id);
    
    // Validate email format if provided
    if (updateCustomerDto.email) {
      if (!this.validateEmail(updateCustomerDto.email)) {
        throw new HttpException('Invalid email format', HttpStatus.BAD_REQUEST);
      }
      updateCustomerDto.email = updateCustomerDto.email.toLowerCase();
    }
    
    // Format phone number if provided in update
    if (updateCustomerDto.phone_number) {
      updateCustomerDto.phone_number = PhoneValidator.formatPhoneNumber(updateCustomerDto.phone_number);
    }
    
    await this.customerRepository.update(id, updateCustomerDto);
    return this.findOne(id);
  }

  async updateCustomer(updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.doesEmailOrPhoneExist(null,updateCustomerDto.phone_number);
    if (customer) {
      return this.update(customer.id, updateCustomerDto);
    }
    return this.customerRepository.update(customer.id, updateCustomerDto);
  }

  async softDelete(id: string): Promise<Customer> {
    const customer = await this.findOne(id);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    
    customer.isDeleted = true;
    return this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id); // Check if the customer exists
    await this.customerRepository.remove(customer);
  }

  async removeMultiple(ids: string[]): Promise<any> {
    const results = [];
    
    for (const id of ids) {
      try {
        const customer = await this.findOne(id);
        await this.customerRepository.remove(customer);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, message: error.message });
      }
    }
    
    return {
      message: 'Customers deletion completed',
      results
    };
  }
}
