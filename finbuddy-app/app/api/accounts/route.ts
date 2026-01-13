import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const key = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev_secret_change_me"
);

async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return (payload as any)?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function ensureDefaultAccounts(userId: string) {
  const existing = await db
    .select({ type: accounts.type })
    .from(accounts)
    .where(eq(accounts.userId, userId));

  const have = new Set(existing.map((x) => x.type));
  const toInsert = [];

  if (!have.has("cash")) {
    toInsert.push({
      id: createId(),
      userId,
      type: "cash",
      name: "Cash",
      balanceCents: 0,
    });
  }

  if (!have.has("card")) {
    toInsert.push({
      id: createId(),
      userId,
      type: "card",
      name: "Card",
      balanceCents: 0,
    });
  }

  if (toInsert.length) {
    await db.insert(accounts).values(toInsert);
  }
}

export async function GET() {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDefaultAccounts(userId);

  const rows = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId));

  return NextResponse.json({ accounts: rows });
}
