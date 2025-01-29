import { Repository } from 'typeorm';
import { Customer } from './entities/customers.entity';
import { CreateCustomerDto } from './dto/create.dto';
import { UpdateCustomerDto } from './dto/update.dto';
export declare class CustomersService {
    private readonly customerRepository;
    constructor(customerRepository: Repository<Customer>);
    create(createCustomerDto: CreateCustomerDto): Promise<Customer>;
    findAll(page: any, perPage: any, filterOptions: any): Promise<{
        categories: Customer[];
        total: number;
    }>;
    findOne(id: string): Promise<Customer>;
    doesEmailOrPhoneExist(email?: string, phone_number?: string): Promise<Customer>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer>;
    remove(id: string): Promise<void>;
}
