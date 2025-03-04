import { Controller, Post, UseInterceptors, UploadedFile, } from '@nestjs/common'; 
// import { ProductService } from './product.service'; 
import { FilesAzureService } from './azure-storage.service'; 
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('products') export class ProductController { 
	constructor( 
    	// private readonly productService: ProductService, 
        private readonly fileService: FilesAzureService 
    ) {} 
    
    @Post('upload') 
    @UseInterceptors(FileInterceptor('myFile')) 
    async create(@UploadedFile() file: Express.Multer.File) { 
    	const containerName = 'fileupload'; 
        const upload = await this.fileService.uploadFile(file, containerName) 
        // this.productService.saveUrl(upload); 
        return { upload, message: 'uploaded successfully' } 
    } 
}
