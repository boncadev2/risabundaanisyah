import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requestUrl, sessionCookieName, signSession } from "@/lib/auth";

export async function POST(request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const ipAddress = clientIp(request);
  const { prisma } = await import("@/lib/prisma");
  const blockedSince = new Date(Date.now() - 15 * 60 * 1000);
  const identityFilters = [{ email }];
  if (ipAddress !== "unknown") identityFilters.push({ ipAddress });
  const failedAttempts = await prisma.loginAttempt.count({
    where: { success: false, createdAt: { gte: blockedSince }, OR: identityFilters }
  });

  if (failedAttempts >= 5) {
    return NextResponse.redirect(requestUrl(request, "/login?error=locked"), 303);
  }

  const user = await findUser(email, password);

  if (!user) {
    await recordAttempt(prisma, { email, ipAddress, success: false, reason: "invalid_credentials" });
    return NextResponse.redirect(requestUrl(request, "/login?error=invalid"), 303);
  }

  await Promise.all([
    recordAttempt(prisma, { email, ipAddress, success: true, reason: "success" }),
    prisma.loginAttempt.deleteMany({ where: { success: false, OR: identityFilters } }),
    prisma.auditLog.create({ data: { userId: user.id, userEmail: user.email, action: "LOGIN_SUCCESS", details: "Login admin berhasil", ipAddress } })
  ]);

  const token = signSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    sessionVersion: user.sessionVersion
  });

  const response = NextResponse.redirect(requestUrl(request, "/admin"), 303);
  response.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  return response;
}

function clientIp(request) {
  return String(request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown").split(",")[0].trim().slice(0, 191);
}

async function recordAttempt(prisma, data) {
  return prisma.loginAttempt.create({ data });
}

async function findUser(email, password) {
  return findPrismaUser(email, password);
}

async function findPrismaUser(email, password) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const allowedRoles = ["super_admin", "admin", "operator"];
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      console.warn(`Login failed: user not found (${email})`);
      return null;
    }

    if (!user.isActive) {
      console.warn(`Login failed: inactive user (${email})`);
      return null;
    }

    if (!allowedRoles.includes(user.role?.slug)) {
      console.warn(`Login failed: role not allowed (${email}, role: ${user.role?.slug || "none"})`);
      return null;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.warn(`Login failed: invalid password (${email})`);
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.slug,
      sessionVersion: user.sessionVersion
    };
  } catch (error) {
    console.error("Failed to login with database user", error);
    return null;
  }
}
