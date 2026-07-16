import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getUploadDir } from "@/lib/uploads";

const contentTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

export async function GET(_request, { params }) {
  const { path: pathParts = [] } = await params;
  const uploadDir = getUploadDir();
  const filePath = path.resolve(uploadDir, ...pathParts);

  if (!filePath.startsWith(path.resolve(uploadDir))) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }

    const file = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
