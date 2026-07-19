import { NextResponse } from "next/server";
import { getCurrentUser, requestUrl, sessionCookieName } from "@/lib/auth";

export async function POST(request) {
  const user = await getCurrentUser();
  if (user) {
    const { prisma } = await import("@/lib/prisma");
    await prisma.auditLog.create({
      data: {
        userId: Number(user.id),
        userEmail: user.email,
        action: "LOGOUT",
        details: "Admin keluar dari sistem",
        ipAddress: String(request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown").split(",")[0].trim().slice(0, 191)
      }
    });
  }
  const response = NextResponse.redirect(requestUrl(request, "/login"), 303);
  response.cookies.delete(sessionCookieName());
  return response;
}
