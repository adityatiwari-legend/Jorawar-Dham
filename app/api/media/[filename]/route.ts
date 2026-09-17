import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { ALLOWED_MIME_MAP } from "@/lib/storage";

// Determine MIME by file extension
function getMimeByExtension(ext: string): string {
  for (const [mime, exts] of Object.entries(ALLOWED_MIME_MAP)) {
    if (exts.includes(ext.toLowerCase())) {
      return mime;
    }
  }
  return "application/octet-stream";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Defense against path traversal
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename || filename.includes("..")) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const baseDir = path.join(process.cwd(), "storage", "uploads");
    const filePath = path.join(baseDir, safeFilename);

    // Verify resolved path stays strictly within uploads directory
    if (!filePath.startsWith(baseDir)) {
      return new NextResponse("Access denied", { status: 403 });
    }

    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat || !stat.isFile()) {
      return new NextResponse("File not found", { status: 404 });
    }

    const ext = path.extname(safeFilename);
    const mimeType = getMimeByExtension(ext);
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": stat.size.toString(),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
