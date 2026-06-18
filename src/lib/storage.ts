import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT ?? "localhost";
const port = Number.parseInt(process.env.MINIO_PORT ?? "9000", 10);
const useSsl = process.env.MINIO_USE_SSL === "true";
const accessKeyId = process.env.MINIO_ACCESS_KEY ?? "minioadmin";
const secretAccessKey = process.env.MINIO_SECRET_KEY ?? "minioadmin";

export const minioBucket = process.env.MINIO_BUCKET ?? "reisebericht-media";

export const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: `${useSsl ? "https" : "http"}://${endpoint}:${port}`,
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});
