import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  try {
    const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev_secret_change_me");
    await jwtVerify(token, key, { algorithms: ["HS256"] });
  } catch {
    return NextResponse.redirect(new URL("/home", request.url));
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
