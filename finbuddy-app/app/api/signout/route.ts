// app/api/signout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const res = NextResponse.json({ isSession: false });

  res.cookies.set("session", "", {
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return res;
}

