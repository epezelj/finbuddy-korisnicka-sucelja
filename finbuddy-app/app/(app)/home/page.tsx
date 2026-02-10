import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { and, eq, gte, lt, sum, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { Wallet, CreditCard } from "lucide-react";
import dynamic from "next/dynamic";

const Hero = dynamic(() =>
  import("../../_components/MarketingSections").then((m) => ({
    default: m.Hero,
  }))
);
const Features = dynamic(() =>
  import("../../_components/MarketingSections").then((m) => ({
    default: m.Features,
  }))
);
const PersonaSection = dynamic(() =>
  import("../../_components/MarketingSections").then((m) => ({
    default: m.PersonaSection,
  }))
);
const HowItWorks = dynamic(() =>
  import("../../_components/MarketingSections").then((m) => ({
    default: m.HowItWorks,
  }))
);
const FinalCTA = dynamic(() =>
  import("../../_components/MarketingSections").then((m) => ({
    default: m.FinalCTA,
  }))
);


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

function monthRange(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 1));
  const toYMD = (d: Date) => d.toISOString().slice(0, 10);
  return { startYMD: toYMD(start), endYMD: toYMD(end) };
}

function fmtEUR(cents: number) {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}


async function Dashboard({ userId }: { userId: string }) {
  await ensureDefaultAccounts(userId);

  const { startYMD, endYMD } = monthRange(new Date());

  const [accRows, [incomeRow], [expenseRow]] = await Promise.all([
    db.select().from(accounts).where(eq(accounts.userId, userId)),

    db
      .select({ total: sum(transactions.amountCents).mapWith(Number) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.kind, "income"),
          gte(transactions.date, startYMD),
          lt(transactions.date, endYMD)
        )
      ),

    db
      .select({ total: sum(transactions.amountCents).mapWith(Number) })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.kind, "expense"),
          gte(transactions.date, startYMD),
          lt(transactions.date, endYMD)
        )
      ),
  ]);

  const incomeCents = incomeRow?.total ?? 0;
  const expenseCents = expenseRow?.total ?? 0;

  return (
    <>
      {/* Accounts */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Accounts</h2>
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
                  {fmtEUR(acc.balanceCents ?? 0)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Monthly Summary
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-blue-200">
            <div className="text-gray-600 text-sm mb-2">Total Income</div>
            <div className="text-green-700 font-semibold">
              {fmtEUR(incomeCents)}
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-blue-200">
            <div className="text-gray-600 text-sm mb-2">Total Expense</div>
            <div className="text-red-700 font-semibold">
              {fmtEUR(expenseCents)}
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-blue-200">
            <div className="text-gray-600 text-sm mb-2">Net</div>
            <div className="text-blue-700 font-semibold">
              {fmtEUR(incomeCents - expenseCents)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-10">
        <div className="h-5 w-24 bg-gray-200 rounded mb-4" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-28 bg-gray-200 rounded-xl" />
          <div className="h-28 bg-gray-200 rounded-xl" />
        </div>
      </div>
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );
}


export default async function HomePage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  return (
    <div className="bg-[#F9FAFB]">
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of your accounts and monthly summary.
          </p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard userId={userId} />
        </Suspense>
      </section>

      <Hero />
      <Features />
      <PersonaSection />
      <HowItWorks />
      <FinalCTA />
    </div>
  );
}