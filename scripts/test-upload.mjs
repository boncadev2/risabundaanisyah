import { stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getUploadDir, saveUploadedImage } from "../lib/uploads.js";

const fileName = `upload-test-${Date.now()}.png`;
const formData = new FormData();
const validImage = await sharp({ create: { width: 24, height: 24, channels: 3, background: "#08a64b" } }).png().toBuffer();
formData.set("imageFile", new File([validImage], fileName, { type: "image/png" }));

const publicPath = await saveUploadedImage(formData, "imageFile");
const uploadDir = getUploadDir();
const savedPath = path.join(uploadDir, path.basename(publicPath));
const fileStat = await stat(savedPath);

const invalidForm = new FormData();
invalidForm.set("imageFile", new File([Buffer.from("bukan-gambar")], "gambar-palsu.png", { type: "image/png" }));
let invalidRejected = false;
try {
  await saveUploadedImage(invalidForm, "imageFile");
} catch {
  invalidRejected = true;
}

await unlink(savedPath);

console.log(JSON.stringify({
  ok: true,
  publicPath,
  uploadDir,
  bytes: fileStat.size,
  invalidRejected
}, null, 2));
