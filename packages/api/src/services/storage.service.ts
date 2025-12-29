import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

export class StorageService {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || 'us-east-1';
    const accessKey = process.env.S3_ACCESS_KEY;
    const secretKey = process.env.S3_SECRET_KEY;
    const bucket = process.env.S3_BUCKET;

    if (!endpoint || !accessKey || !secretKey || !bucket) {
      throw new Error('S3 configuration is missing');
    }

    this.bucket = bucket;
    this.publicUrl = process.env.S3_PUBLIC_URL || `${endpoint}/${bucket}`;
    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });
  }

  async getPresignedUploadUrl(params: {
    fileName: string;
    contentType: string;
    folder?: string;
  }) {
    const folder = params.folder?.trim() || 'uploads';
    const safeName = sanitizeFileName(params.fileName);
    const key = `${folder}/${Date.now()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 60 * 10 });
    const publicUrl = `${this.publicUrl}/${key}`;

    return { uploadUrl, key, publicUrl };
  }
}
