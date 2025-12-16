// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const key = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev_secret_change_me"
);

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  // Not signed in
  if (!token) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Invalid / expired token
  try {
    await jwtVerify(token, key, { algorithms: ["HS256"] });
  } catch {
    const res = NextResponse.redirect(new URL("/signin", request.url));
    res.cookies.set("session", "", { path: "/", expires: new Date(0) });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/accounts/:path*",
    "/transactions/:path*",
    "/reports/:path*",
    "/categories/:path*",
    "/blog/:path*",
    "/settings/:path*",
  ],
};
