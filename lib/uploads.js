import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadDir = path.join(process.cwd(), "public", "uploads");
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

function safeName(name) {
  const ext = path.extname(name || "").toLowerCase();
  const base = path
    .basename(name || "gambar", ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

  return `${base || "gambar"}-${Date.now()}${ext || ".jpg"}`;
}

export async function saveUploadedImage(formData, key, fallback = "") {
  const file = formData.get(key);

  if (!file || typeof file === "string" || file.size === 0) {
    return fallback || null;
  }

  if (!allowedTypes.has(file.type)) {
    throw new Error("Format gambar harus JPG, PNG, WEBP, GIF, atau SVG.");
  }

  await mkdir(uploadDir, { recursive: true });

  const fileName = safeName(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), buffer);

  return fileName;
}
