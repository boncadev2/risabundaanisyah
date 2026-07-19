import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { requestUrl } from "@/lib/auth";

const protectedRoutes = ["/admin"];

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!needsAuth) return secureResponse(NextResponse.next());

  const token = request.cookies.get("rsia_session")?.value;

  if (!token) {
    return NextResponse.redirect(requestUrl(request, "/login"));
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || "local-dev-secret");
    const allowedRoles = ["super_admin", "admin", "operator"];

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.redirect(requestUrl(request, "/login?error=forbidden"));
    }

    return secureResponse(NextResponse.next());
  } catch {
    return NextResponse.redirect(requestUrl(request, "/login"));
  }
}

function secureResponse(response) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};
