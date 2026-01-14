import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
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

function toCents(amount: number) {
  return Math.round(amount * 100);
}

// Helper function to update the account balance
async function updateAccountBalance(accountId: string, amountCents: number) {
  const account = await db
    .select({ balanceCents: accounts.balanceCents })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (account.length > 0) {
    const newBalance = account[0].balanceCents + amountCents; // Update the balance
    await db
      .update(accounts)
      .set({ balanceCents: newBalance })
      .where(eq(accounts.id, accountId));
  }
}

export async function GET() {
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Join accounts so the list can show "Cash/Card" + name
  const rows = await db
    .select({
      id: transactions.id,
      kind: transactions.kind,
      amountCents: transactions.amountCents,
      category: transactions.category,
      date: transactions.date,
      note: transactions.note,
      accountId: transactions.accountId,
      accountName: accounts.name,
      accountType: accounts.type,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(and(eq(transactions.userId, userId), eq(accounts.userId, userId)))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));

  return NextResponse.json({ transactions: rows });
}

export async function POST(req: Request) {
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const kind = body.kind === "income" || body.kind === "expense" ? body.kind : null;
  const amount = typeof body.amount === "number" ? body.amount : null;
  const accountId = typeof body.accountId === "string" ? body.accountId : null;
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const date = typeof body.date === "string" ? body.date : null;
  const note = typeof body.note === "string" ? body.note.trim() : null;

  if (!kind || amount === null || !accountId || !category || !date) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Ensure the account belongs to the user (prevents posting into someone else’s account)
  const acc = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .limit(1);

  if (!acc.length) {
    return NextResponse.json({ error: "Invalid account" }, { status: 400 });
  }

  const row = {
    id: createId(),
    userId,
    accountId,
    kind,
    amountCents: toCents(amount),
    category,
    date, // "YYYY-MM-DD"
    note,
  };

  // Insert the transaction into the database
  await db.insert(transactions).values(row);

  // Update the account balance
  const amountCents = toCents(amount); // Convert to cents
  if (kind === "income") {
    await updateAccountBalance(accountId, amountCents); // Increase balance for income
  } else if (kind === "expense") {
    await updateAccountBalance(accountId, -amountCents); // Decrease balance for expense
  }

  return NextResponse.json({ ok: true });
}
