import { NextRequest, NextResponse } from "next/server";
import { signup } from "@/lib/auth-node";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const result = await signup(formData);

  const res = NextResponse.json(result);

  if (result.check === "success" && result.token) {
    res.cookies.set("session", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: result.expires,
    });
  }

  return res;
}
