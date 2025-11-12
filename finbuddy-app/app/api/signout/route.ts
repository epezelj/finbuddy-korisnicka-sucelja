import { NextResponse } from "next/server";
import { signout } from "@/lib/auth-node";  

export async function GET(req: Request) {
      console.log("DEBUG2");

  const result = await signout();

  console.log(result);

  return NextResponse.json(result);
}

