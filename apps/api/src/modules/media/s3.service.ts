import { Injectable } from "@nestjs/common";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;

  constructor() {
    const endpoint = `${process.env.MINIO_USE_SSL === "true" ? "https" : "http"}://${
      process.env.MINIO_ENDPOINT ?? "localhost"
    }:${process.env.MINIO_PORT ?? "9000"}`;

    this.client = new S3Client({
      endpoint,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER ?? "journaladmin",
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? "journalsecret",
      },
    });
    this.bucket = process.env.MINIO_BUCKET ?? "journal-media";
    this.publicUrlBase = process.env.MINIO_PUBLIC_URL ?? `${endpoint}/${this.bucket}`;
  }

  async upload(journalId: string, file: Express.Multer.File) {
    const key = `journals/${journalId}/${randomUUID()}-${file.originalname}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return { key, url: `${this.publicUrlBase}/${key}` };
  }

  async remove(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
