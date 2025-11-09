import { cookies } from "next/headers";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";


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

  if (!email || !password) throw new Error("Email and password are required");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use");

  const passwordHash = await bcrypt.hash(password, 12);
  const created = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true },
  });

  // issue session cookie
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  const session = await encrypt({ user: created, expAt: expires.toISOString() });
  cookieStore.set("session", session, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires,
  });

  return created;
}

export async function login(formData: FormData) {
  const email = (formData.get("email") ?? "").toString().toLowerCase().trim();
  const password = (formData.get("password") ?? "").toString();

  const user = await prisma.user.findUnique({ where: { email } });
  console.log(user);
  const ok = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash): false;
  
  console.log(user, ok, password, password);

  if (!user || !ok){
    return {ok, error:"Wrong email addres or password"}

  };


  const cookieStore = await cookies();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  const token = await encrypt({ user: { id: user.id, email: user.email, name: user.name ?? null }, expAt: expires.toISOString() });

  cookieStore.set("session", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires,
  });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(0),
  });
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
