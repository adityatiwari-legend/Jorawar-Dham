import path from "path";
import { AppError } from "@/lib/utils/errors";

export interface StorageMetadata {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadResult {
  fileKey: string;
  fileUrl: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface StorageService {
  upload(fileBuffer: Buffer, metadata: StorageMetadata): Promise<UploadResult>;
  delete(fileKey: string): Promise<boolean>;
  getUrl(fileKey: string): string;
  getFilePath(fileKey: string): string;
}

// Strictly permitted MIME types and their canonical extensions
export const ALLOWED_MIME_MAP: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
};

// Forbidden executable or dangerous file extensions
export const FORBIDDEN_EXTENSIONS = new Set([
  ".exe", ".sh", ".php", ".js", ".ts", ".mjs", ".cjs", ".bat",
  ".cmd", ".ps1", ".vbs", ".dll", ".so", ".bin", ".com", ".scr",
  ".pif", ".py", ".rb", ".pl", ".html", ".htm", ".svg", ".xhtml"
]);

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_DOC_SIZE = 10 * 1024 * 1024;   // 10 MB

/**
 * Validates magic bytes (binary signatures) of the uploaded buffer
 */
export function validateMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (declaredMime === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (declaredMime === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WEBP: RIFF....WEBP (bytes 0-3: 52 49 46 46, bytes 8-11: 57 45 42 50)
  if (declaredMime === "image/webp") {
    const isRiff =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // PDF: %PDF- (25 50 44 46)
  if (declaredMime === "application/pdf") {
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }

  return false;
}

/**
 * Validates file buffer, extension, and MIME type against strict security rules
 */
export function validateMediaUpload(
  buffer: Buffer,
  metadata: StorageMetadata
): { sanitizedExtension: string; safeMimeType: string } {
  const originalExt = path.extname(metadata.originalFilename).toLowerCase();

  // 1. Explicitly reject dangerous extensions
  if (FORBIDDEN_EXTENSIONS.has(originalExt)) {
    throw new AppError("Forbidden file extension. Executable files are strictly blocked.", "FILE_REJECTED", 400);
  }

  // 2. Validate MIME type whitelist
  const allowedExts = ALLOWED_MIME_MAP[metadata.mimeType];
  if (!allowedExts) {
    throw new AppError(
      `Unsupported file type: ${metadata.mimeType}. Only JPG, PNG, WEBP, and PDF are permitted.`,
      "INVALID_MIME_TYPE",
      400
    );
  }

  // 3. Verify extension matches MIME type
  if (!allowedExts.includes(originalExt)) {
    throw new AppError(
      `Extension mismatch: file extension '${originalExt}' does not correspond to MIME '${metadata.mimeType}'.`,
      "EXTENSION_MISMATCH",
      400
    );
  }

  // 4. Validate file size
  const isImage = metadata.mimeType.startsWith("image/");
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;
  if (buffer.length > maxSize) {
    throw new AppError(
      `File size exceeds maximum permitted limit (${maxSize / (1024 * 1024)}MB).`,
      "FILE_TOO_LARGE",
      400
    );
  }

  // 5. Inspect magic bytes for binary spoofing defense
  if (!validateMagicBytes(buffer, metadata.mimeType)) {
    throw new AppError(
      "Binary signature mismatch. The file content does not match its declared format.",
      "MAGIC_BYTE_MISMATCH",
      400
    );
  }

  return {
    sanitizedExtension: originalExt,
    safeMimeType: metadata.mimeType,
  };
}
