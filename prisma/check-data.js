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

async function main() {
  const [
    services,
    activeServices,
    doctors,
    activeDoctors,
    schedules,
    articles,
    publishedArticles,
    galleries,
    activeGalleries,
    bookings,
    settings
  ] = await Promise.all([
    prisma.service.count(),
    prisma.service.count({ where: { isActive: true } }),
    prisma.doctor.count(),
    prisma.doctor.count({ where: { isActive: true } }),
    prisma.doctorSchedule.count(),
    prisma.article.count(),
    prisma.article.count({ where: { status: "publish" } }),
    prisma.gallery.count(),
    prisma.gallery.count({ where: { isActive: true } }),
    prisma.booking.count(),
    prisma.siteSetting.count()
  ]);

  console.log(JSON.stringify({
    services,
    activeServices,
    doctors,
    activeDoctors,
    schedules,
    articles,
    publishedArticles,
    galleries,
    activeGalleries,
    bookings,
    settings
  }, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
