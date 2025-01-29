import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customers.entity';
import { CreateCustomerDto } from './dto/create.dto';
import { UpdateCustomerDto } from './dto/update.dto';

@Injectable()
export class CustomersService {
  constructor(
    @Inject('CUSTOMERS_REPOSITORY')
    private readonly customerRepository: Repository<Customer>,
  ) { }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    if (createCustomerDto.dob) {
      const currentYear = new Date().getFullYear();
      const DobYear = new Date(createCustomerDto.dob).getFullYear();
      createCustomerDto.age = (currentYear - DobYear).toString()

    }
    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async findAll(page, perPage, filterOptions) {
    page = page || 1;
    perPage = perPage || 10;
    const queryBuilder = this.customerRepository.createQueryBuilder('user');

    // Apply filters based on filterOptions
    if (filterOptions) {
      if (filterOptions.search) {
        const searchString = await filterOptions.search.startsWith(' ')
          ? filterOptions.search.replace(' ', '+')
          : filterOptions.search;
        filterOptions.search = searchString
        queryBuilder.andWhere('(user.email ILIKE :search OR user.name ILIKE :search OR user.phone_number ILIKE :search OR user.gender ILIKE :search)', {
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
    console.log(customer)
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    await this.findOne(id);
    await this.customerRepository.update(id, updateCustomerDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id); // Check if the customer exists
    await this.customerRepository.remove(customer);
  }
}
