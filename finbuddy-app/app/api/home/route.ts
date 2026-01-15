import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { and, eq, gte, lt, sum, desc } from "drizzle-orm";
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
  const toInsert: Array<typeof accounts.$inferInsert> = [];

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

function monthRange(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-11
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 1));
  const toYMD = (d: Date) => d.toISOString().slice(0, 10);
  return { startYMD: toYMD(start), endYMD: toYMD(end) };
}

export async function GET() {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDefaultAccounts(userId);

  const accRows = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId));

  const recent = await db
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
  .orderBy(desc(transactions.date), desc(transactions.createdAt))
  .limit(5);


  const balanceCents = accRows.reduce((s, a) => s + (a.balanceCents ?? 0), 0);

  const { startYMD, endYMD } = monthRange(new Date());

  // sum income and expense separately for this month
  const [incomeRow] = await db
    .select({ total: sum(transactions.amountCents).mapWith(Number) })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.kind, "income"),
        gte(transactions.date, startYMD),
        lt(transactions.date, endYMD)
      )
    );

  const [expenseRow] = await db
    .select({ total: sum(transactions.amountCents).mapWith(Number) })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.kind, "expense"),
        gte(transactions.date, startYMD),
        lt(transactions.date, endYMD)
      )
    );

    

  const incomeCents = incomeRow?.total ?? 0;
  const expenseCents = expenseRow?.total ?? 0;

  return NextResponse.json({
    accounts: accRows,
    summary: {
      monthStart: startYMD,
      monthEndExclusive: endYMD,
      incomeCents,
      expenseCents,
      netCents: incomeCents - expenseCents,
      balanceCents,
    },
    recentTransactions: recent,
  });
}
