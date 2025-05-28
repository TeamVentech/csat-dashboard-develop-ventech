import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Query,
    Body,
    Req,
    UseGuards,
    UseInterceptors,
    ClassSerializerInterceptor,
    BadRequestException,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create.dto';
import { UpdateCustomerDto } from './dto/update.dto';
import { Customer } from './entities/customers.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    // Create a new customer
    @Post()
    @Permissions('Clients Management::write')
    async create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
        return this.customersService.create(createCustomerDto);
    }

    // Get all customers with pagination and filtering
    @Get()
    findAll(
        @Query('page') page: number,
        @Query('perPage') perPage: number,
        @Query('search') search?: string,
    ) {
        const filterOptions = {
            search
        };
        return this.customersService.findAll(page, perPage, filterOptions);
    }

    @Get('report/all')
    findAllCustomer(@Query('search') search: number,) {
        const filterOptions = {
            search
        };
        return this.customersService.findAllCustomers(filterOptions);
    }

    @Get('check-existence')
    async checkExistence(
      @Query('email') email?: string,
      @Query('phone_number') phone_number?: string,
    ) {
      if (!email && !phone_number) {
        throw new BadRequestException('You must provide an email or phone number.');
      }
  
      const exists = await this.customersService.doesEmailOrPhoneExist(email, phone_number);
      return { exists };
    }


    // Get a customer by ID
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Customer> {
        return this.customersService.findOne(id);
    }

    @Put('update-customer')
    async updateCustomer(@Body() updateCustomerDto: UpdateCustomerDto){
        return this.customersService.updateCustomer(updateCustomerDto);
    } 
    // Update a customer by ID
    @Put(':id')
    @Permissions('Clients Management::update')
    async update(
        @Param('id') id: string,
        @Body() updateCustomerDto: UpdateCustomerDto,
    ): Promise<Customer> {
        return this.customersService.update(id, updateCustomerDto);
    }



    // Delete a customer by ID
    @Delete(':id')
    @Permissions('Clients Management::delete')
    async remove(@Param('id') id: string): Promise<void> {
        return this.customersService.remove(id);
    }

    // Soft delete a customer by ID
    @Delete(':id/soft')
    @Permissions('Clients Management::delete')
    async softDelete(@Param('id') id: string): Promise<Customer> {
        return this.customersService.softDelete(id);
    }
}
