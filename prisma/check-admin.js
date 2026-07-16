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
  const email = (process.env.ADMIN_EMAIL || "admin@rsia.test").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const allowedRoles = ["super_admin", "admin", "operator"];

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true }
  });

  if (!user) {
    console.log(JSON.stringify({ ok: false, email, reason: "USER_NOT_FOUND" }, null, 2));
    return;
  }

  const passwordLooksHashed = user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$");
  const passwordValid = password ? await bcrypt.compare(password, user.password) : false;
  const roleSlug = user.role?.slug || null;

  console.log(JSON.stringify({
    ok: Boolean(user.isActive && allowedRoles.includes(roleSlug) && passwordValid),
    email: user.email,
    name: user.name,
    isActive: user.isActive,
    role: roleSlug,
    roleAllowed: allowedRoles.includes(roleSlug),
    passwordLooksHashed,
    passwordChecked: Boolean(password),
    passwordValid
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
