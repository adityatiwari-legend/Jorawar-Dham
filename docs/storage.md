# Jorawar Dham - Media Storage Architecture

## 1. Abstraction Design (`StorageService`)

Media storage is decoupled from the underlying physical infrastructure via the `StorageService` interface in `lib/storage/index.ts`.

```ts
export interface StorageMetadata {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadResult {
  fileKey: string;      // Nonce/UUID based identifier
  fileUrl: string;      // Public accessible URL (/api/media/[filename])
  mimeType: string;
  sizeBytes: number;
}

export interface StorageService {
  upload(fileBuffer: Buffer, metadata: StorageMetadata): Promise<UploadResult>;
  delete(fileKey: string): Promise<boolean>;
  getUrl(fileKey: string): string;
}
```

---

## 2. Storage Drivers

### LocalStorageService (Current Development Driver)
- **Directory**: `storage/uploads/` located outside the public web root (`public/`).
- Files cannot be directly served by static web servers, preventing arbitrary script execution.
- Access is mediated exclusively through the `/api/media/[filename]` route handler.

### Cloud Storage Driver (S3 / R2 / MinIO Prepared)
- The architecture is configured with environment variable placeholders (`STORAGE_DRIVER=s3`, `S3_ENDPOINT`, `S3_BUCKET`, etc.).
- An S3 driver implementing `StorageService` can be swapped in without modifying any application business logic or CMS code.

---

## 3. Storage Security Controls

| Control | Implementation |
| :--- | :--- |
| **Filename Randomization** | User-supplied names are discarded. Stored filenames are generated via `crypto.randomUUID() + safe_extension`. |
| **Extension Whitelist** | Only `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf` are permitted. Executables (`.exe`, `.sh`, `.php`, `.js`, `.bat`, `.cmd`, `.py`) are rejected immediately. |
| **Magic Bytes Inspection** | The binary header of the uploaded buffer is evaluated to confirm true file signature (e.g. `89 50 4E 47` for PNG, `FF D8 FF` for JPEG, `52 49 46 46` for WEBP, `25 50 44 46` for PDF). Spoofed file extensions are rejected. |
| **Payload Size Enforcement** | Image uploads: Max 5 MB. PDF documents: Max 10 MB. |
| **Path Traversal Defense** | Storage keys are validated through `path.basename()` and path resolution checks to guarantee all files remain strictly inside `storage/uploads/`. |
| **Safe Serving Headers** | Responses include `X-Content-Type-Options: nosniff`, appropriate sanitized `Content-Type`, and aggressive caching headers (`Cache-Control: public, max-age=31536000, immutable`). |
