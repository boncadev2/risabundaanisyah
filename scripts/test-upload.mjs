import { stat, unlink } from "node:fs/promises";
import path from "node:path";
import { getUploadDir, saveUploadedImage } from "../lib/uploads.js";

const fileName = `upload-test-${Date.now()}.png`;
const formData = new FormData();
formData.set("imageFile", new File([Buffer.from("upload-test")], fileName, { type: "image/png" }));

const publicPath = await saveUploadedImage(formData, "imageFile");
const uploadDir = getUploadDir();
const savedPath = path.join(uploadDir, path.basename(publicPath));
const fileStat = await stat(savedPath);

await unlink(savedPath);

console.log(JSON.stringify({
  ok: true,
  publicPath,
  uploadDir,
  bytes: fileStat.size
}, null, 2));
