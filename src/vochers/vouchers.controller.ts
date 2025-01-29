import { Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpException,
  HttpStatus,

 } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVouchersDto } from './dto/create.dto';
import { UpdateVouchersDto } from './dto/update.dto';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorator/permissions.decorator';

@Controller('voucher')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @Permissions('Stock::write')

  create(@Body() createVouchersDto: any) {
    return this.vouchersService.create(createVouchersDto);
  }

  @Get()
  @Permissions('Stock::read')
  findAll(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('search') search?: string,
  ) {
    const filterOptions = {
      search
  };
    return this.vouchersService.findAll(page, perPage, filterOptions);
  }

  @Get(':id')
  @Permissions('Stock::read')

  findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  @Post('import')
  @Permissions('Stock::read')
  async importVouchers(@Body() data: any[]): Promise<{ message: string }> {
    if (!Array.isArray(data) || data.length === 0) {
      throw new HttpException('Invalid data', HttpStatus.BAD_REQUEST);
    }

    await this.vouchersService.importVouchers(data);
    return { message: 'Vouchers imported successfully' };
  }

  @Post('GetAvailableVoucher')
  @Permissions('Stock::read')
  async GetAvailableVoucher(@Body() data: any) {
    return await this.vouchersService.GetAvailableVoucher(data);
    // return { message: 'Vouchers imported successfullsy' };
  }


  // @Get('type/:type')
  // @Permissions('Stock::read')
  // findType(@Param('type') type: string) {
  //   return this.vouchersService.findType(type);
  // }

  @Patch(':id')
  @Permissions('Stock::update')

  update(@Param('id') id: string, @Body() updateVouchersDto: UpdateVouchersDto) {
    return this.vouchersService.update(id, updateVouchersDto);
  }

  @Delete(':id')
  @Permissions('Stock::delete')

  remove(@Param('id') id: string) {
    return this.vouchersService.remove(id);
  }
}
