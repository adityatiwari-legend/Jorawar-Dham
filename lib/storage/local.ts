import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  StorageService,
  StorageMetadata,
  UploadResult,
  validateMediaUpload,
} from "./index";
import { AppError } from "@/lib/utils/errors";
import logger from "@/lib/logger";

export class LocalStorageService implements StorageService {
  private baseDir: string;

  constructor(customPath?: string) {
    this.baseDir = customPath
      ? path.join(process.cwd(), "storage", path.basename(customPath))
      : path.join(process.cwd(), "storage", "uploads");
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (err) {
      logger.error("Failed to create storage directory:", { error: String(err) });
    }
  }

  private sanitizeFileKey(fileKey: string): string {
    // Strip directory traversal tokens and extract pure basename
    const base = path.basename(fileKey);
    const resolved = path.resolve(this.baseDir, base);

    // Strict boundary enforcement: must remain inside baseDir
    if (!resolved.startsWith(this.baseDir)) {
      throw new AppError("Invalid file key. Path traversal detected.", "SECURITY_VIOLATION", 400);
    }

    return base;
  }

  async upload(fileBuffer: Buffer, metadata: StorageMetadata): Promise<UploadResult> {
    await this.ensureDirectory();

    // Validate size, extension, MIME, and magic bytes
    const { sanitizedExtension, safeMimeType } = validateMediaUpload(fileBuffer, metadata);

    // Generate non-sequential, cryptographically random fileKey
    const fileKey = `${crypto.randomUUID()}${sanitizedExtension}`;
    const destinationPath = path.join(this.baseDir, fileKey);

    await fs.writeFile(destinationPath, fileBuffer);

    logger.info(`Media uploaded securely: key=${fileKey}, size=${fileBuffer.length}B, mime=${safeMimeType}`);

    return {
      fileKey,
      fileUrl: this.getUrl(fileKey),
      originalFilename: path.basename(metadata.originalFilename),
      mimeType: safeMimeType,
      sizeBytes: fileBuffer.length,
    };
  }

  async delete(fileKey: string): Promise<boolean> {
    try {
      const safeKey = this.sanitizeFileKey(fileKey);
      const filePath = path.join(this.baseDir, safeKey);
      await fs.unlink(filePath);
      logger.info(`Media file deleted: ${safeKey}`);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(fileKey: string): string {
    const safeKey = this.sanitizeFileKey(fileKey);
    return `/api/media/${safeKey}`;
  }

  getFilePath(fileKey: string): string {
    const safeKey = this.sanitizeFileKey(fileKey);
    return path.join(this.baseDir, safeKey);
  }
}

// Global StorageService instance
export const storage: StorageService = new LocalStorageService();
export default storage;
