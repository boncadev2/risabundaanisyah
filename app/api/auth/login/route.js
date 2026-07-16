import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requestUrl, sessionCookieName, signSession } from "@/lib/auth";

export async function POST(request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await findUser(email, password);

  if (!user) {
    return NextResponse.redirect(requestUrl(request, "/login?error=invalid"), 303);
  }

  const token = signSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
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
      role: user.role.slug
    };
  } catch (error) {
    console.error("Failed to login with database user", error);
    return null;
  }
}
