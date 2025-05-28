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
import { CorporatesService } from './corporates.service';
import { CreateCorporateDto } from './dto/create.dto';
import { UpdateCorporateDto } from './dto/update.dto';
import { Corporate } from './entities/corporates.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('corporates')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)

export class CorporatesController {
    constructor(private readonly corporatesService: CorporatesService) { }

    // Create a new corporate
    @Post()
    @Permissions('Clients Management::read')
    async create(@Body() createCorporateDto: CreateCorporateDto): Promise<Corporate> {
        return this.corporatesService.create(createCorporateDto);
    }

    // Get all corporates with pagination and filtering
    @Get()
    findAll(
        @Query('page') page: number,
        @Query('perPage') perPage: number,
        @Query('search') search?: string,
    ) {
        const filterOptions = {
            search
        };
        return this.corporatesService.findAll(page, perPage, filterOptions);
    }

    @Get('get/all')
    find(@Query('name') name?: string,
    ) {
        return this.corporatesService.find(name);
    }


    @Get('report/all')
    findAllCorporate(@Query('search') search: number,) {
        const filterOptions = {
            search
        };
        return this.corporatesService.findAllCorporate(filterOptions);
    }
    // Get a corporate by ID
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Corporate> {
        return this.corporatesService.findOne(id);
    }

    // Update a corporate by ID
    @Put(':id')
    @Permissions('Clients Management::update')
    async update(
        @Param('id') id: string,
        @Body() updatecorporateDto: UpdateCorporateDto,
    ): Promise<Corporate> {
        return this.corporatesService.update(id, updatecorporateDto);
    }

    // Delete a corporate by ID
    @Delete(':id')
    @Permissions('Clients Management::delete')
    async remove(@Param('id') id: string): Promise<void> {
        return this.corporatesService.remove(id);
    }
}
