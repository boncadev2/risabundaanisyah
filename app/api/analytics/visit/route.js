import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const visitorId = String(body.visitorId || "").slice(0, 191);
    const path = String(body.path || "").slice(0, 191);

    if (!visitorId || !path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/login")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");
    await prisma.visitorEvent.create({
      data: {
        visitorId,
        path,
        referrer: String(body.referrer || "").slice(0, 2000) || null,
        userAgent: String(request.headers.get("user-agent") || "").slice(0, 1000) || null,
        ipAddress: clientIp(request)
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to record visitor", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const value = forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "";
  return String(value).trim().slice(0, 191) || null;
}
