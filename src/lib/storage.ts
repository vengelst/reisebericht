import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

/** Uploads a buffer to MinIO under the given key. */
export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: minioBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/** Deletes an object from MinIO (no error if it does not exist). */
export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: minioBucket, Key: key }),
  );
}

/** Fetches an object's bytes and content type for serving via the app. */
export async function getFile(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    const result = await s3Client.send(
      new GetObjectCommand({ Bucket: minioBucket, Key: key }),
    );
    if (!result.Body) return null;
    const bytes = await result.Body.transformToByteArray();
    return {
      body: Buffer.from(bytes),
      contentType: result.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

/** Returns a presigned GET URL (default 1 hour) for direct access to a key. */
export async function getPublicUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: minioBucket, Key: key }),
    { expiresIn },
  );
}

let bucketEnsured = false;

/** Creates the media bucket if it does not exist yet (idempotent, cached). */
export async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: minioBucket }));
    bucketEnsured = true;
    return;
  } catch {
    // Bucket missing (or no head permission) — try to create it.
  }
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: minioBucket }));
  } catch {
    // Likely already exists / owned by another account — ignore.
  }
  bucketEnsured = true;
}
