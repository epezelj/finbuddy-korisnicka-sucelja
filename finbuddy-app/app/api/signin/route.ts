import { NextResponse } from "next/server";
import { signin } from "@/lib/auth-node";  

export async function POST(req: Request) {
      console.log("printtttt");
  const formData = await req.formData();

  
  const result = await signin(formData);

  // if (!result?.check) {
  //   return NextResponse.json({ check:false });
  // }

  // return NextResponse.json({ check:true });

  return NextResponse.json(result);
}

