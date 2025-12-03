// lib/auth-node.ts
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

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

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing && password.length < 6) {
    return {
      check: "both",
      errorExistEmail: "Email already in use",
      errorShortPass: "Password must be at least 6 characters",
    };
  }

  if (password.length < 6) {
    return {
      check: "shortPass",
      error: "Password must have at least 6 characters",
    };
  }

  if (existing) {
    return {
      check: "existEmail",
      error: "Email already in use",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [created] = await db
    .insert(users)
    .values({ email, passwordHash, name })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

  const expires = new Date(Date.now() + 15 * 60 * 1000);
  const token = await encrypt({
    user: created,
    expAt: expires.toISOString(),
  });

  // ➜ only return data; DO NOT set cookies here
  return {
    check: "success",
    token,
    expires,
  };
}

export async function signin(formData: FormData) {
  const email = (formData.get("email") ?? "").toString().toLowerCase().trim();
  const password = (formData.get("password") ?? "").toString();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const ok =
    user?.passwordHash &&
    (await bcrypt.compare(password, user.passwordHash));

  if (!user || !ok) {
    return { check: false, error: "Email or password are incorrect" };
  }

  const expires = new Date(Date.now() + 15 * 60 * 1000);
  const token = await encrypt({
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
    },
    expAt: expires.toISOString(),
  });

  return {
    check: true,
    token,
    expires,
  };
}


export async function signoutInfo() {
  const cookieStore = await cookies();
  const hasSession = !!cookieStore.get("session")?.value;
  return { isSession: hasSession };
}


export async function getSessionFromToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}
