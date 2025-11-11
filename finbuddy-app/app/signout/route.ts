import { NextResponse } from "next/server";
import { signout } from "@/lib/auth-node";

export async function GET(request: Request) {
  await signout(); 
  return NextResponse.redirect(new URL("/signin", request.url));
}
