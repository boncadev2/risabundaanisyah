import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.delete(sessionCookieName());
  return response;
}
