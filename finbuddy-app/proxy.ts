import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "./lib";

export default async function proxy(request: NextRequest) {
  return (await updateSession(request)) ?? NextResponse.next();
}


