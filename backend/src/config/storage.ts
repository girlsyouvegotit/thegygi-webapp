import { env } from "./env.js";

/**
 * Storage configuration for recordings and file uploads
 */
export interface StorageConfig {
  provider: "local" | "cloudinary" | "aws-s3";
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  recordingPath: string;
  maxRecordingDuration: number;
}

export const storageConfig: StorageConfig = {
  provider: env.storage.provider,
  bucket: env.storage.bucket,
  region: env.storage.region,
  accessKey: env.storage.accessKey,
  secretKey: env.storage.secretKey,
  cloudinaryCloudName: env.storage.cloudinaryCloudName,
  cloudinaryApiKey: env.storage.cloudinaryApiKey,
  cloudinaryApiSecret: env.storage.cloudinaryApiSecret,
  recordingPath: env.storage.recordingPath,
  maxRecordingDuration: env.storage.maxRecordingDuration,
};

/**
 * Generate a storage path for a recording
 */
export const generateRecordingPath = (
  categoryId: string,
  classId: string,
  sessionId: string,
  fileExtension: string = "webm",
): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `recordings/${year}/${month}/${day}/${categoryId}/${classId}/${sessionId}.${fileExtension}`;
};

/**
 * Generate a storage path for thumbnails
 */
export const generateThumbnailPath = (
  categoryId: string,
  classId: string,
  sessionId: string,
): string => {
  return `thumbnails/${categoryId}/${classId}/${sessionId}.jpg`;
};

export default storageConfig;