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
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create.dto';
import { UpdateTenantDto } from './dto/update.dto';
import { Tenant } from './entities/tenants.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    // Create a new tenant
    @Post()
    @Permissions('Lookups::write')
    async create(@Body() createTenantDto: CreateTenantDto){
        return this.tenantsService.create(createTenantDto);
    }

    // Get all tenants with pagination and filtering
    @Get()
    findAll(
        @Query('page') page: number,
        @Query('perPage') perPage: number,
        @Query('search') search?: string,
    ) {
        const filterOptions = {
            search
        };
        return this.tenantsService.findAll(page, perPage, filterOptions);
    }

    @Get('report/all')
    findAllTenants(@Query('search') search: number) {
        const filterOptions = {
            search
        };
        return this.tenantsService.findAllTenants(filterOptions);
    }
    // Get a tenant by ID
    @Get(':id')
    @Permissions('Lookups::read')
    async findOne(@Param('id') id: string): Promise<Tenant> {
        return this.tenantsService.findOne(id);
    }

    // Update a tenant by ID
    @Put(':id')
    @Permissions('Lookups::update')
    async update(
        @Param('id') id: string,
        @Body() updateTenantDto: UpdateTenantDto,
    ): Promise<Tenant> {
        return this.tenantsService.update(id, updateTenantDto);
    }

    // Delete a tenant by ID
    @Delete(':id')
    @Permissions('Lookups::delete')
    async remove(@Param('id') id: string): Promise<void> {
        const ids = id.split(',');
        return this.tenantsService.removeMultiple(ids);
    }
}
