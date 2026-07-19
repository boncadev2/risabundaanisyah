import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const projectDir = process.cwd();
const logDir = path.join(projectDir, "logs");
await mkdir(logDir, { recursive: true });

if (process.platform === "darwin") {
  await installLaunchAgent();
} else {
  installCron();
}

async function installLaunchAgent() {
  const label = "id.rsiabundaanisyah.database-backup";
  const agentsDir = path.join(os.homedir(), "Library", "LaunchAgents");
  const plistPath = path.join(agentsDir, `${label}.plist`);
  await mkdir(agentsDir, { recursive: true });
  const xml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key><array>
    <string>${xml(process.execPath)}</string>
    <string>--env-file=${xml(path.join(projectDir, ".env"))}</string>
    <string>${xml(path.join(projectDir, "scripts", "backup-database.mjs"))}</string>
  </array>
  <key>WorkingDirectory</key><string>${xml(projectDir)}</string>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>2</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>${xml(path.join(logDir, "backup.log"))}</string>
  <key>StandardErrorPath</key><string>${xml(path.join(logDir, "backup-error.log"))}</string>
</dict></plist>\n`;
  await writeFile(plistPath, plist);

  const domain = `gui/${process.getuid()}`;
  spawnSync("launchctl", ["bootout", domain, plistPath], { encoding: "utf8" });
  const result = spawnSync("launchctl", ["bootstrap", domain, plistPath], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "Gagal memasang LaunchAgent backup.");
  console.log(`Backup database otomatis terpasang melalui launchd: setiap hari pukul 02.00 (${plistPath})`);
}

function installCron() {
  const schedule = process.env.BACKUP_CRON || "0 2 * * *";
  if (!/^[\d*/?,\-]+\s+[\d*/?,\-]+\s+[\d*/?,\-]+\s+[\d*/?,\-]+\s+[\d*/?,\-]+$/.test(schedule)) throw new Error("Format BACKUP_CRON tidak valid.");
  const quote = (value) => `'${String(value).replaceAll("'", "'\\''")}'`;
  const marker = "# rsia-bunda-annisyah-database-backup";
  const command = `${schedule} cd ${quote(projectDir)} && ${quote(process.execPath)} --env-file=${quote(path.join(projectDir, ".env"))} ${quote(path.join(projectDir, "scripts", "backup-database.mjs"))} >> ${quote(path.join(logDir, "backup.log"))} 2>&1`;
  const currentResult = spawnSync("crontab", ["-l"], { encoding: "utf8" });
  const current = currentResult.status === 0 ? currentResult.stdout : "";
  const cleaned = current.split("\n").filter((line) => line.trim() && !line.includes(marker) && !line.includes("scripts/backup-database.mjs"));
  const nextCrontab = `${cleaned.join("\n")}${cleaned.length ? "\n" : ""}${marker}\n${command}\n`;
  const install = spawnSync("crontab", ["-"], { input: nextCrontab, encoding: "utf8" });
  if (install.status !== 0) throw new Error(install.stderr || "Gagal memasang jadwal cron.");
  console.log(`Backup database otomatis terpasang melalui cron: ${schedule}`);
}
