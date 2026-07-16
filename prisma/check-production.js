const { access, mkdir, writeFile, unlink } = require("node:fs/promises");
const path = require("node:path");
const { constants } = require("node:fs");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

function createMariaDbAdapter() {
  const databaseUrl = new URL(process.env.DATABASE_URL);

  return new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: databaseUrl.port ? Number(databaseUrl.port) : 3306,
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.replace("/", "")
  });
}

const prisma = new PrismaClient({
  adapter: createMariaDbAdapter()
});

async function checkUploadDir() {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const testFile = path.join(uploadDir, `.write-test-${Date.now()}.txt`);

  await mkdir(uploadDir, { recursive: true });
  await access(uploadDir, constants.W_OK);
  await writeFile(testFile, "ok");
  await unlink(testFile);

  return uploadDir;
}

async function main() {
  const tables = [
    "Role",
    "User",
    "Doctor",
    "DoctorSchedule",
    "Service",
    "Article",
    "Gallery",
    "Booking",
    "SiteSetting"
  ];

  const tableRows = await prisma.$queryRawUnsafe("SHOW TABLES");
  const existingTables = tableRows.flatMap((row) => Object.values(row));
  const counts = {
    services: await prisma.service.count(),
    doctors: await prisma.doctor.count(),
    schedules: await prisma.doctorSchedule.count(),
    articles: await prisma.article.count(),
    galleries: await prisma.gallery.count(),
    bookings: await prisma.booking.count(),
    settings: await prisma.siteSetting.count()
  };
  const uploadDir = await checkUploadDir();

  console.log(JSON.stringify({
    ok: true,
    databaseConnected: true,
    missingTables: tables.filter((table) => !existingTables.includes(table)),
    counts,
    uploadWritable: true,
    uploadDir
  }, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Production check failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
