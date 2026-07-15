const bcrypt = require("bcryptjs");
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
  const role = await prisma.role.upsert({
    where: { slug: "super_admin" },
    update: { name: "Super Admin" },
    create: {
      name: "Super Admin",
      slug: "super_admin"
    }
  });

  const user = await prisma.user.upsert({
    where: { email: "admin@rsia.test" },
    update: {
      name: "Admin RSIA",
      roleId: role.id,
      isActive: true
    },
    create: {
      name: "Admin RSIA",
      email: "admin@rsia.test",
      password: await bcrypt.hash("password", 10),
      roleId: role.id,
      isActive: true
    }
  });

  console.log(`Admin database siap: ${user.email}`);
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
