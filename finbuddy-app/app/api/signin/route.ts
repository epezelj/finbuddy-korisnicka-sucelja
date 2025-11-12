import { NextResponse } from "next/server";
import { signin } from "@/lib/auth-node";  

export async function POST(req: Request) {
  const formData = await req.formData();

  const result = await signin(formData);

  return NextResponse.json(result);
}

