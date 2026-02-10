import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { Wallet, CreditCard } from "lucide-react";


const key = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev_secret_change_me"
);

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      clockTolerance: 15,
    });
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


async function AccountCards({ userId }: { userId: string }) {
  await ensureDefaultAccounts(userId);

  const accRows = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {accRows.map((acc) => {
        const isCash = acc.type === "cash";
        return (
          <div
            key={acc.id}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  isCash
                    ? "bg-green-50 text-green-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {isCash ? (
                  <Wallet className="h-5 w-5" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
              </div>
              <div className="text-sm font-medium text-gray-600">
                {acc.name}
              </div>
            </div>
            <div className="mt-4 text-xl font-semibold text-gray-900">
              €{((acc.balanceCents ?? 0) / 100).toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div className="animate-pulse grid gap-6 md:grid-cols-2">
      <div className="h-28 bg-gray-200 rounded-xl" />
      <div className="h-28 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default async function AccountsPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Accounts
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your cash and card balances.
        </p>
      </div>

      <Suspense fallback={<AccountsSkeleton />}>
        <AccountCards userId={userId} />
      </Suspense>
    </main>
  );
}