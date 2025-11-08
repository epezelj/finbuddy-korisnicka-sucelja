import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.SESSION_SECRET ?? "dev_secret_change_me";
const key = new TextEncoder().encode(secretKey);

export async function encryptEdge(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(key);
}

export async function decryptEdge(input: string) {
  const { payload } = await jwtVerify(input, key, { algorithms: ["HS256"] });
  return payload;
}

// Only cookie refresh logic (no prisma/bcrypt here!)
export async function updateSessionEdge(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return;

  try {
    const parsed = await decryptEdge(token);
    const res = NextResponse.next();
    const newExp = new Date(Date.now() + 15 * 60 * 1000);
    res.cookies.set({
      name: "session",
      value: await encryptEdge({ ...parsed, expAt: newExp.toISOString() }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: newExp,
    });
    return res;
  } catch {
    const res = NextResponse.next();
    res.cookies.set({ name: "session", value: "", path: "/", expires: new Date(0) });
    return res;
  }
}
