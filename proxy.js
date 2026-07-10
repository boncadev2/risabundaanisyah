import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const protectedRoutes = ["/admin"];

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get("rsia_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || "local-dev-secret");
    const allowedRoles = ["super_admin", "admin", "operator"];

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"]
};
