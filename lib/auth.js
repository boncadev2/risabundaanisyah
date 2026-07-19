import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "rsia_session";

export function signSession(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion
    },
    process.env.JWT_SECRET || "local-dev-secret",
    { expiresIn: "8h" }
  );
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const session = jwt.verify(token, process.env.JWT_SECRET || "local-dev-secret");
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: Number(session.id) },
      include: { role: true }
    });

    if (!user?.isActive || user.sessionVersion !== session.sessionVersion || user.role?.slug !== session.role) return null;
    return session;
  } catch {
    return null;
  }
}

export function sessionCookieName() {
  return COOKIE_NAME;
}

export function requestUrl(request, path) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");

  if (host) {
    const proto = forwardedProto || (host.includes("localhost") ? "http" : "https");
    return new URL(path, `${proto}://${host}`);
  }

  return new URL(path, request.url);
}
