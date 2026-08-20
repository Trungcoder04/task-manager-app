import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { minioClient, BUCKET_NAME } from '../config/minio';
import { randomUUID } from 'crypto';

export interface UploadResult {
  objectName: string;
  fileUrl: string;
  fileName: string;
}

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  async ensureBucketExists(bucket: string = BUCKET_NAME): Promise<void> {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket, 'us-east-1');
        this.logger.log(`Created MinIO bucket: ${bucket}`);
      }

      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetBucketLocation', 's3:ListBucket'],
            Resource: [`arn:aws:s3:::${bucket}`],
          },
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
    } catch (error) {
      this.logger.warn(`MinIO bucket check/policy warning: ${error}`);
    }
  }

  async uploadFile(
    folder: string,
    file: Express.Multer.File,
    bucket: string = BUCKET_NAME,
  ): Promise<UploadResult> {
    await this.ensureBucketExists(bucket);

    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectName = `${folder}/${Date.now()}-${randomUUID()}-${sanitizedFileName}`;

    await minioClient.putObject(
      bucket,
      objectName,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
      },
    );

    const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const protocol = useSSL ? 'https' : 'http';
    const fileUrl = `${protocol}://${endPoint}:${port}/${bucket}/${objectName}`;

    return {
      objectName,
      fileUrl,
      fileName: file.originalname,
    };
  }

  async deleteFile(
    fileUrlOrObjectName: string,
    bucket: string = BUCKET_NAME,
  ): Promise<void> {
    try {
      let objectName = fileUrlOrObjectName;
      if (fileUrlOrObjectName.includes(`/${bucket}/`)) {
        const parts = fileUrlOrObjectName.split(`/${bucket}/`);
        objectName = parts[1];
      }
      await minioClient.removeObject(bucket, objectName);
    } catch (err) {
      this.logger.warn(`Failed to delete object from MinIO: ${err}`);
    }
  }

  async getPresignedUrl(
    fileUrlOrObjectName: string,
    expirySeconds: number = 3600,
    bucket: string = BUCKET_NAME,
  ): Promise<string> {
    let objectName = fileUrlOrObjectName;
    if (fileUrlOrObjectName.includes(`/${bucket}/`)) {
      const parts = fileUrlOrObjectName.split(`/${bucket}/`);
      objectName = parts[1];
    }
    return minioClient.presignedGetObject(bucket, objectName, expirySeconds);
  }
}
