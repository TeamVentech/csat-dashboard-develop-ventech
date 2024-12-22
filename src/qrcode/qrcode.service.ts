import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QRCodes } from './entities/qrCodes.entity';
import { CreateQRCodeDto } from './dto/create.dto';
import { UpdateQRCodeDto } from './dto/update.dto';
import * as QRCodeLib from 'qrcode';
import * as canvas from 'canvas'; // Importing the canvas package
import * as path from 'path';

@Injectable()
export class QRCodesService {
  constructor(
    @Inject('QRCODE_REPOSITORY')
    private readonly qrCodeRepository: Repository<QRCodes>,
  ) { }

  async create(createQRCodeDto: any) {
    console.log(createQRCodeDto);
  
    // Create the identifier URL for the QR code
    const identifier = `https://nooracademy.co.uk/#/${createQRCodeDto.surveyId}/${createQRCodeDto.subcategoryId}/`;
  
    // Generate the QR code image as a data URL
    const qrCodeData = await QRCodeLib.toDataURL(identifier);
  
    // Create a canvas to manipulate the QR code image
    const qrImage = await canvas.loadImage(qrCodeData);
    const qrCanvas = canvas.createCanvas(200, 200);
    const ctx = qrCanvas.getContext('2d');

    // // Set canvas dimensions to match the QR code image size
    // qrCanvas.width = qrImage.width;
    // qrCanvas.height = qrImage.height;
  
    // Draw the QR code on the canvas
    ctx.drawImage(qrImage, 0, 0);
  
    // var logoImage = await canvas.loadImage("https://secure.b8cdn.com/120x120/images/logo/34/305934_logo_1465816142_n.png");


    // Calculate the position to center the logo image within the QR code
    const logoSize = qrImage.width / 5; // Adjust the size of the logo (1/5th of the QR code size)
    const logoX = (qrImage.width - logoSize) / 2;
    const logoY = (qrImage.height - logoSize) / 2;
  
    // Draw the logo image at the center of the QR code
    // ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
  
    // Export the canvas to a data URL (this will be the QR code with the centered logo)
    const finalQRCodeData = qrCanvas.toDataURL();
  
    // Return the result with the QR code image in the response
    return { ...createQRCodeDto, image: finalQRCodeData };
}

  async findAll(page: number = 1, perPage: number = 10) {
    const [qrcodes, total] = await this.qrCodeRepository.findAndCount({
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return { qrcodes, total };
  }
  async findOne(id: string) {
    const qrCode = await this.qrCodeRepository.findOne({ where: { surveyId: id } });
    if (!qrCode) {
      throw new NotFoundException(`QR Code with ID ${id} not found`);
    }
    return qrCode;
  }

  async update(id: string, updateQRCodeDto: UpdateQRCodeDto) {
    await this.findOne(id); // Check if the QR code exists
    await this.qrCodeRepository.update(id, updateQRCodeDto);
    return this.findOne(id); // Return the updated QR code
  }

  async remove(id: string): Promise<void> {
    const qrCode = await this.findOne(id); // Check if the QR code exists
    await this.qrCodeRepository.remove(qrCode);
  }


  async generateAndSaveQRCode(createQRCodeDto: any) {
    // Check if a QR code for the same survey already exists
    const survey = await this.qrCodeRepository.findOne({ where: { surveyId: createQRCodeDto.surveyId } });
  
    if (survey) {
      return {
        message: "The Survey QR already Exists",
      };
    }
  
    // Create the identifier URL
    const identifier = `https://nooracademy.co.uk/#/${createQRCodeDto.location_id}/${createQRCodeDto.survey_template_id}/`;
  
    // Generate the QR code image as a data URL
    const qrCodeData = await QRCodeLib.toDataURL(identifier);
  
    // Load the QR code image into a canvas
    const qrCanvas = canvas.createCanvas(200,100, "svg");
    const ctx = qrCanvas.getContext('2d');
  
    // Create an Image object for the QR code
    const qrImage = await canvas.loadImage(qrCodeData);
    
    // Set canvas dimensions to match the QR code image size
    qrCanvas.width = qrImage.width;
    qrCanvas.height = qrImage.height;
  
    // Draw the QR code on the canvas
    ctx.drawImage(qrImage, 0, 0);
  
    // Load the logo image to place in the center of the QR code
    const logoImage = await canvas.loadImage('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScLNkN0D-vwqEAyMlLYFaDsJwGoVKmIEcABg&s'); // Path to the image you want to add in the center
  
    // Calculate the position to center the logo image
    const logoSize = qrImage.width / 5; // Logo size can be adjusted based on preference
    const logoX = (qrImage.width - logoSize) / 2;
    const logoY = (qrImage.height - logoSize) / 2;
  
    // Draw the logo image at the center of the QR code
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
  
    // Export the canvas to a data URL (which will be the QR code with the center image)
    const finalQRCodeData = qrCanvas.toDataURL();
  
    // Create a QR code entity and save it
    const qrCode = this.qrCodeRepository.create({ ...createQRCodeDto, image: finalQRCodeData });
    const result = await this.qrCodeRepository.save(qrCode);
    
    return result;
  }
}