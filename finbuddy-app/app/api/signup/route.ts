import { NextResponse } from "next/server";
import { signup } from "@/lib/auth-node";  // Assuming your signup logic is in this file

export async function POST(req: Request) {
  const formData = await req.formData();
  const result = await signup(formData);

  return NextResponse.json(result);
}
