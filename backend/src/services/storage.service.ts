import fs from "fs";
import path from "path";
import { UTApi } from "uploadthing/server";
import { storageConfig } from "../config/storage.js";

let utapiInstance: UTApi | null = null;
const getUtApi = (): UTApi => {
  if (!utapiInstance) utapiInstance = new UTApi();
  return utapiInstance;
};

class StorageService {
  private basePath: string;

  constructor() {
    this.basePath = path.resolve(storageConfig.recordingPath);
    this.ensureBasePath();
  }

  private ensureBasePath(): void {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  /** Reject any path that escapes the base directory */
  private resolveSafe(filePath: string): string {
    const fullPath = path.resolve(this.basePath, filePath);
    if (!fullPath.startsWith(this.basePath + path.sep)) {
      throw new Error("Invalid storage path");
    }
    return fullPath;
  }

  isLocalRecordingRef(storageRef: string): boolean {
    return storageRef.startsWith("recordings/");
  }

  async saveFile(filePath: string, data: Buffer): Promise<string> {
    const fullPath = this.resolveSafe(filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(fullPath, data);
    return fullPath;
  }

  async getFile(filePath: string): Promise<Buffer> {
    return fs.promises.readFile(this.resolveSafe(filePath));
  }

  async deleteFile(filePath: string): Promise<void> {
    // UploadThing-managed file → delete via API
    if (!this.isLocalRecordingRef(filePath)) {
      try {
        await getUtApi().deleteFiles([filePath]);
      } catch (error) {
        console.error("UploadThing delete failed:", error);
      }
      return;
    }
    const fullPath = this.resolveSafe(filePath);
    if (fs.existsSync(fullPath)) await fs.promises.unlink(fullPath);
  }

  async fileExists(filePath: string): Promise<boolean> {
    if (!this.isLocalRecordingRef(filePath)) return true;
    return fs.existsSync(this.resolveSafe(filePath));
  }

  /**
   * Resolve a stored UploadThing file key to a playable URL.
   * Local `recordings/...` refs should use `/api/recordings/:id/stream` instead.
   */
  async generateTemporaryUrl(
    storageRef: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    if (this.isLocalRecordingRef(storageRef)) {
      throw new Error(
        "Local recordings must be streamed via /api/recordings/:id/stream",
      );
    }

    const utapi = getUtApi();

    // UploadThing v7: method is generateSignedURL (capital URL)
    if (typeof utapi.generateSignedURL === "function") {
      const { ufsUrl } = await utapi.generateSignedURL(storageRef, {
        expiresIn: `${expiresInSeconds}s`,
      });
      if (ufsUrl) return ufsUrl;
    }

    if (typeof utapi.getSignedURL === "function") {
      const signed = await utapi.getSignedURL(storageRef, {
        expiresIn: `${expiresInSeconds}s`,
      });
      if (signed.ufsUrl || signed.url) return signed.ufsUrl || signed.url;
    }

    const urls = await utapi.getFileUrls(storageRef);
    const first = urls.data?.[0];
    if (first?.url) return first.url;

    throw new Error("Unable to resolve UploadThing playback URL");
  }

  async generateDownloadUrl(
    storageRef: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    if (this.isLocalRecordingRef(storageRef)) {
      throw new Error(
        "Local recordings must be downloaded via /api/recordings/:id/stream",
      );
    }
    return this.generateTemporaryUrl(storageRef, expiresInSeconds);
  }

  async getFileSize(storageRef: string): Promise<number> {
    if (!this.isLocalRecordingRef(storageRef)) return 0;
    const stats = await fs.promises.stat(this.resolveSafe(storageRef));
    return stats.size;
  }

  async listFiles(dirPath: string): Promise<string[]> {
    if (!this.isLocalRecordingRef(dirPath)) return [];
    const fullPath = this.resolveSafe(dirPath);
    if (!fs.existsSync(fullPath)) return [];
    return fs.promises.readdir(fullPath);
  }

  createReadStream(filePath: string): fs.ReadStream {
    return fs.createReadStream(this.resolveSafe(filePath));
  }
}

export const storageService = new StorageService();
export default storageService;
