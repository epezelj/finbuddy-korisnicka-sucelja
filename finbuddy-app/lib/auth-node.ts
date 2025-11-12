import { cookies } from "next/headers";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import { Session } from "inspector/promises";


const secretKey = process.env.SESSION_SECRET ?? "dev_secret_change_me";
const key = new TextEncoder().encode(secretKey);

async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(key);
}


export async function signup(formData: FormData) {
  const name = (formData.get("name") ?? "").toString().trim() || null;
  const email = (formData.get("email") ?? "").toString().toLowerCase().trim();
  const password = (formData.get("password") ?? "").toString();

  // if (!email || !password) {
  //   return { check: "required", error: "Email and password are required" };
  // }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && (password.length < 6)) {
    return { check: "both", errorExistEmail:  "Email already in use", errorShortPass: "Password must be at least 6 characters" };
  }

  if (password.length < 6) {
    return { check: "shortPass", error: "Password must have at least 6 characters" };
  }

  if (existing) {
    return { check: "existEmail", error: "Email already in use" };
  }


  const passwordHash = await bcrypt.hash(password, 12);
  const created = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true },
  });

  const cookieStore = await cookies();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  const session = await encrypt({ user: created, expAt: expires.toISOString() });
  cookieStore.set("session", session, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires,
  });

  return { check: "success"}

}


export async function signin(formData: FormData) {
  const email = (formData.get("email") ?? "").toString().toLowerCase().trim();
  const password = (formData.get("password") ?? "").toString();

  const user = await prisma.user.findUnique({ where: { email } });
  const check = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash): false;
 
  if (!user || !check) return { check: false, error: "Email or password are incorrect" };
 
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  const token = await encrypt({ user: { id: user.id, email: user.email, name: user.name ?? null }, expAt: expires.toISOString() });

  cookieStore.set("session", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires,
  });

  return { check: true };

}


export async function signout() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(0),
  });
   if (!cookieStore){
    return {check: true}
   }
   else{
    return {check: false}
   }
}


export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload;
  } catch { cookieStore.set("session", "", { path: "/", expires: new Date(0) }); return null; }
}
