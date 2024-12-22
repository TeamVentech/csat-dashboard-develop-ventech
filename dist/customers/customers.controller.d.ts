import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create.dto';
import { UpdateCustomerDto } from './dto/update.dto';
import { Customer } from './entities/customers.entity';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(createCustomerDto: CreateCustomerDto): Promise<Customer>;
    findAll(page: number, perPage: number, search?: string): Promise<{
        categories: Customer[];
        total: number;
    }>;
    findOne(id: string): Promise<Customer>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer>;
    remove(id: string): Promise<void>;
}
