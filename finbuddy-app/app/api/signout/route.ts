// app/api/signout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { signoutInfo } from "@/lib/auth-node"; 

export async function GET(req: NextRequest) {
  const info = await signoutInfo().catch(() => ({ isSession: false }));

  const res = NextResponse.json(info);

  res.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0), 
  });

  return res;
}
