import { NextRequest, NextResponse } from "next/server";
import { signin } from "@/lib/auth-node";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const result = await signin(formData);

  const res = NextResponse.json(result);
  console.log("debuh");

  if (result.check && result.token) {
    res.cookies.set("session", result.token, {
      sameSite: "lax",
      path: "/",
      expires: result.expires,
    });
  }

  return res;
}
