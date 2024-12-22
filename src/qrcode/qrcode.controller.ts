import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { QRCodesService } from './qrcode.service';
import { CreateQRCodeDto } from './dto/create.dto';
import { UpdateQRCodeDto } from './dto/update.dto';

@Controller('qrcodes')
export class QRCodesController {
  constructor(private readonly qrcodesService: QRCodesService) {}

  @Post()
  create(@Body() createQRCodeDto: any) {
    return this.qrcodesService.create(createQRCodeDto);
  }

  @Post('generate')
  async generateQRCode(@Body() createQRCodeDto: any) {
    return this.qrcodesService.generateAndSaveQRCode(createQRCodeDto);
  }


  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    return this.qrcodesService.findAll(page, perPage);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qrcodesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQRCodeDto: UpdateQRCodeDto) {
    return this.qrcodesService.update(id, updateQRCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.qrcodesService.remove(id);
  }
}
