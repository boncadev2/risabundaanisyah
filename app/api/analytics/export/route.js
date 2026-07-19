import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "view_statistics")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fromValue = request.nextUrl.searchParams.get("from");
  const toValue = request.nextUrl.searchParams.get("to");
  const from = parseDate(fromValue, new Date(Date.now() - 29 * 86400000));
  const to = parseDate(toValue, new Date());
  to.setHours(23, 59, 59, 999);

  const { prisma } = await import("@/lib/prisma");
  const events = await prisma.visitorEvent.findMany({
    where: { createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: "desc" }
  });

  const rows = [
    ["Waktu", "Alamat IP", "Halaman", "Perangkat", "Sistem Operasi", "Browser", "Sumber"],
    ...events.map((event) => [
      event.createdAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      event.ipAddress || "-",
      event.path,
      deviceName(event.userAgent),
      osName(event.userAgent),
      browserName(event.userAgent),
      sourceName(event.referrer)
    ])
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const filename = `statistik-pengunjung-${dateKey(from)}-${dateKey(to)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}

function parseDate(value, fallback) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return new Date(fallback);
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
}

function dateKey(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function deviceName(userAgent = "") {
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) return "Tablet";
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "HP";
  return "Desktop";
}

function osName(userAgent = "") {
  if (/windows nt 10/i.test(userAgent)) return "Windows";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS/iPadOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/mac os x|macintosh/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Lainnya";
}

function browserName(userAgent = "") {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) return "Chrome";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) return "Safari";
  return "Lainnya";
}

function sourceName(referrer = "") {
  if (!referrer) return "Langsung";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "") || "Lainnya";
  } catch {
    return "Lainnya";
  }
}

function csvCell(value) {
  let safe = String(value ?? "");
  if (/^[=+\-@]/.test(safe)) safe = `'${safe}`;
  return `"${safe.replaceAll('"', '""')}"`;
}
