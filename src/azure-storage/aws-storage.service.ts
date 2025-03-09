import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesS3Service {
  private s3: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      },
    });

    this.bucketName = "csat-doc";
  }

  async uploadFile(file: Express.Multer.File, folder: string) {
    const fileKey = `${folder}/${uuidv4()}.${file.originalname.split('.').pop()}`;

    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.s3.send(new PutObjectCommand(uploadParams));
    return `https://csat-doc.s3.us-west-2.amazonaws.com/${fileKey}`;
  }

  async deleteFile(fileKey: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      }),
    );
  }

  async getSignedUrl(fileKey: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    return await getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }
}
