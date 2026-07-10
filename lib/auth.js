import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "rsia_session";

export function signSession(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
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
    return jwt.verify(token, process.env.JWT_SECRET || "local-dev-secret");
  } catch {
    return null;
  }
}

export function sessionCookieName() {
  return COOKIE_NAME;
}
