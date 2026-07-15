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
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@rsia.test").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "password";
  const adminName = process.env.ADMIN_NAME || "Admin RSIA";

  if (adminPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD minimal 8 karakter untuk akun production.");
  }

  const role = await prisma.role.upsert({
    where: { slug: "super_admin" },
    update: { name: "Super Admin" },
    create: {
      name: "Super Admin",
      slug: "super_admin"
    }
  });

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: await bcrypt.hash(adminPassword, 10),
      roleId: role.id,
      isActive: true
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
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
