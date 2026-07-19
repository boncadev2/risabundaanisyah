import { createWriteStream } from "node:fs";
import { chmod, mkdir, readdir, stat, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createGzip } from "node:zlib";
import { finished } from "node:stream/promises";
import path from "node:path";

const databaseUrl = new URL(process.env.DATABASE_URL);
const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), "backups"));
const retentionDays = Math.max(Number(process.env.BACKUP_RETENTION_DAYS || 14), 1);
const dumpBinary = process.env.MYSQLDUMP_BIN || "/Applications/XAMPP/xamppfiles/bin/mysqldump";
const timestamp = new Date().toISOString().replaceAll(":", "-").replace("T", "_").slice(0, 19);
const database = databaseUrl.pathname.replace(/^\//, "");
const destination = path.join(backupDir, `${database}_${timestamp}.sql.gz`);

await mkdir(backupDir, { recursive: true, mode: 0o700 });
await chmod(backupDir, 0o700);

const dump = spawn(dumpBinary, [
  `--host=${databaseUrl.hostname}`,
  `--port=${databaseUrl.port || "3306"}`,
  `--user=${decodeURIComponent(databaseUrl.username)}`,
  "--single-transaction",
  "--quick",
  "--routines",
  "--triggers",
  "--events",
  "--default-character-set=utf8mb4",
  database
], {
  env: { ...process.env, MYSQL_PWD: decodeURIComponent(databaseUrl.password) },
  stdio: ["ignore", "pipe", "pipe"]
});

let errorOutput = "";
dump.stderr.on("data", (chunk) => { errorOutput += chunk.toString(); });
const outputStream = dump.stdout.pipe(createGzip({ level: 9 })).pipe(createWriteStream(destination, { mode: 0o600 }));

const exitCode = await new Promise((resolve, reject) => {
  dump.on("error", reject);
  dump.on("close", resolve);
});
await finished(outputStream);
await chmod(destination, 0o600);

if (exitCode !== 0) {
  await unlink(destination).catch(() => {});
  throw new Error(`Backup database gagal: ${errorOutput.trim() || `mysqldump exit ${exitCode}`}`);
}

const cutoff = Date.now() - retentionDays * 86400000;
const files = await readdir(backupDir);
let deleted = 0;
for (const file of files) {
  if (!file.startsWith(`${database}_`) || !file.endsWith(".sql.gz")) continue;
  const filePath = path.join(backupDir, file);
  const info = await stat(filePath);
  if (info.mtimeMs < cutoff) {
    await unlink(filePath);
    deleted += 1;
  }
}

const result = await stat(destination);
console.log(JSON.stringify({ ok: true, destination, bytes: result.size, retentionDays, oldBackupsDeleted: deleted }, null, 2));
