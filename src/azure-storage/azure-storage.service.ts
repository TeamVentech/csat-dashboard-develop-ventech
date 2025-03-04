import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { uuid } from 'uuidv4';

@Injectable()
export class FilesAzureService {
  constructor(private readonly configService: ConfigService) {}
  private containerName: string;

  private async getBlobServiceInstance() {
    const connectionString = "DefaultEndpointsProtocol=https;AccountName=csatappstorage;AccountKey=KlBeHn4Cii3cONneeBkJVdYXW6haUTqpH88TztPtptRKs9+ENLErkWVMzWh2XNkOf3c31AiNaQ2a+AStHNDFcg==;EndpointSuffix=core.windows.net";
    const blobClientService = await BlobServiceClient.fromConnectionString(
      connectionString,
    );

    return blobClientService;
  }

  private async getBlobClient(imageName: string): Promise<BlockBlobClient> {
    const blobService = await this.getBlobServiceInstance();
    const containerName = this.containerName;
    const containerClient = blobService.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(imageName);
    return blockBlobClient;
  }

private async ensureContainerExists(containerName: string) {
    const blobService = await this.getBlobServiceInstance();
    const containerClient = blobService.getContainerClient(containerName);
    const exists = await containerClient.exists();
    
    if (!exists) {
        await containerClient.create();
        console.log(`Container ${containerName} created successfully.`);
    }
}

  public async uploadFile(file: Express.Multer.File, containerName: string) {
    this.containerName = containerName;
    await this.ensureContainerExists(containerName);  // Ensure container exists before upload
    
    const extension = file.originalname.split('.').pop();
    const file_name = uuid() + '.' + extension;
    const blockBlobClient = await this.getBlobClient(file_name);
    const fileUrl = blockBlobClient.url;

    await blockBlobClient.uploadData(file.buffer);
    return fileUrl;
}


  async deleteFile(file_name: string, containerName: string) {
    try {
      this.containerName = containerName;
      const blockBlobClient = await this.getBlobClient(file_name);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      console.log(error);
    }
  }

  public async downloadFile(file_name: string, containerName: string) {
    this.containerName = containerName;
    const blockBlobClient = await this.getBlobClient(file_name);
    const downloadBlockBlobResponse = await blockBlobClient.download();
    const downloaded = (
      await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
    ).toString();
    return downloaded;
  }

  private streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}
