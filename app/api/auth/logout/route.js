import { NextResponse } from "next/server";
import { requestUrl, sessionCookieName } from "@/lib/auth";

export async function POST(request) {
  const response = NextResponse.redirect(requestUrl(request, "/login"), 303);
  response.cookies.delete(sessionCookieName());
  return response;
}
