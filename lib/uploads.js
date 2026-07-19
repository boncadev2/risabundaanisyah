import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const allowedFormats = new Set(["jpeg", "png", "webp"]);

export function getUploadDir() {
  if (process.env.UPLOAD_DIR) return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR);
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
}

function safeBaseName(name) {
  const ext = path.extname(name || "");
  return path.basename(name || "gambar", ext).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "gambar";
}

export async function saveUploadedImage(formData, key, fallback = "") {
  const file = formData.get(key);
  if (!file || typeof file === "string" || file.size === 0) return fallback || null;

  const ext = path.extname(file.name || "").toLowerCase();
  if (!allowedTypes.has(file.type) || !allowedExtensions.has(ext)) {
    throw new Error("Format gambar harus JPEG, PNG, atau WEBP.");
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Ukuran gambar maksimal 5 MB.");

  const input = Buffer.from(await file.arrayBuffer());
  let metadata;
  try {
    metadata = await sharp(input, { failOn: "warning" }).metadata();
  } catch {
    throw new Error("Isi file bukan gambar yang valid atau file rusak.");
  }
  if (!allowedFormats.has(metadata.format)) throw new Error("Format isi gambar tidak diizinkan.");
  if (!metadata.width || !metadata.height || metadata.width > 12000 || metadata.height > 12000) {
    throw new Error("Dimensi gambar tidak valid atau terlalu besar.");
  }

  const output = await sharp(input, { failOn: "warning" })
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });
  const fileName = `${safeBaseName(file.name)}-${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
  const destination = path.join(uploadDir, fileName);
  const temporary = `${destination}.tmp`;
  await writeFile(temporary, output, { flag: "wx" });
  await rename(temporary, destination);
  return `/uploads/${fileName}`;
}

export async function deleteUploadedImage(publicPath) {
  if (!publicPath || typeof publicPath !== "string" || !publicPath.startsWith("/uploads/")) return false;
  const uploadDir = path.resolve(getUploadDir());
  const fileName = path.basename(publicPath);
  if (!fileName || fileName === ".gitkeep") return false;
  const target = path.resolve(uploadDir, fileName);
  if (path.dirname(target) !== uploadDir) return false;

  try {
    await unlink(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    console.warn(`Gagal menghapus gambar lama: ${fileName}`, error);
    return false;
  }
}
