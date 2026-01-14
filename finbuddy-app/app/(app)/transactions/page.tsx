"use client";

import { useEffect, useMemo, useState } from "react";

type Account = {
  id: string;
  type: string;
  name: string;
  balanceCents: number; // Add balance to Account type
};

type Transaction = {
  id: string;
  kind: "income" | "expense";
  amountCents: number;
  category: string;
  date: string;
  note: string | null;
  accountId: string;
  accountName: string;
  accountType: string;
};

function fmtEUR(cents: number) {
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [category, setCategory] = useState<string>("Food");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>("");

  const total = useMemo(() => {
    return txs.reduce((acc, t) => acc + (t.kind === "income" ? t.amountCents : -t.amountCents), 0);
  }, [txs]);

  async function loadAll() {
    setLoading(true);
    setError(null);

    // Load accounts with updated balances
    const aRes = await fetch("/api/accounts", { cache: "no-store" });
    if (aRes.status === 401) {
      setError("You are not signed in.");
      setLoading(false);
      return;
    }
    if (!aRes.ok) {
      setError("Failed to load accounts.");
      setLoading(false);
      return;
    }
    const aJson = await aRes.json();
    const accs: Account[] = aJson.accounts ?? [];
    setAccounts(accs);
    if (!accountId && accs.length) setAccountId(accs[0].id);

    // Load transactions
    const tRes = await fetch("/api/transactions", { cache: "no-store" });
    if (!tRes.ok) {
      setError("Failed to load transactions.");
      setLoading(false);
      return;
    }
    const tJson = await tRes.json();
    setTxs(tJson.transactions ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError("Amount must be a positive number.");
      return;
    }
    if (!accountId) {
      setError("Choose an account.");
      return;
    }
    if (!category.trim()) {
      setError("Choose a category.");
      return;
    }

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        amount: num,
        accountId,
        category: category.trim(),
        date,
        note: note.trim() ? note.trim() : null,
      }),
    });

    if (res.status === 401) {
      setError("You are not signed in.");
      return;
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to add transaction.");
      return;
    }

    // Clear the form and reload data
    setAmount("");
    setNote("");
    await loadAll(); // Reload accounts and transactions to update balance
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-10">Loading…</div>;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-10 text-red-600">{error}</div>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Header with Blue Background */}
      <div className="mb-8 flex items-center justify-between gap-4 bg-blue-600 text-white p-4 rounded-t-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm">Manage your expenses and incomes here</p>
        </div>
        <div className="rounded-xl bg-gray-50 px-6 py-3 shadow-lg text-gray-900">
          <div className="text-xs">Net Balance</div>
          <div className="text-lg font-semibold text-blue-600">{fmtEUR(total)}</div>
        </div>
      </div>

      {/* Add Transaction Form with Light Gray Background */}
      <form onSubmit={addTransaction} className="mb-8 rounded-xl border bg-gray-50 p-6 shadow-lg">
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="text-xs font-medium text-gray-600">Type</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as any)}
              className="mt-1 w-full rounded-lg border px-3 py-2 border-blue-300 focus:ring-4 focus:ring-blue-500"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 12.50"
              className="mt-1 w-full rounded-lg border border-blue-300 focus:ring-4 focus:ring-blue-500 px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 border-blue-300 focus:ring-4 focus:ring-blue-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-blue-300 focus:ring-4 focus:ring-blue-500 px-3 py-2"
              placeholder="Food, Salary, Rent…"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-blue-300 focus:ring-4 focus:ring-blue-500 px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <div className="md:col-span-4">
            <label className="text-xs font-medium text-gray-600">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-blue-300 focus:ring-4 focus:ring-blue-500 px-3 py-2"
              placeholder="e.g. groceries at Konzum"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-500"
            >
              Add Transaction
            </button>
          </div>
        </div>
      </form>

      {/* Transactions List with Outer Blue Border and Gray Background for Each Row */}
      <div className="rounded-xl border border-blue-300 bg-white shadow-lg">
        <div className="border-b px-6 py-4 text-sm font-semibold text-gray-900">All Transactions</div>
        <div className="divide-y">
          {txs.length === 0 ? (
            <div className="px-6 py-10 text-sm text-gray-600">No transactions yet.</div>
          ) : (
            txs.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 px-6 py-4 border-b border-blue-300 bg-gray-50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{t.category}</span>
                    <span className="text-xs text-gray-500">
                      • {t.accountName} ({t.accountType}) • {t.date}
                    </span>
                  </div>
                  {t.note ? <div className="truncate text-xs text-gray-500">{t.note}</div> : null}
                </div>

                <div className={`text-sm font-semibold ${t.kind === "income" ? "text-green-700" : "text-red-700"}`}>
                  {t.kind === "income" ? "+" : "-"}
                  {fmtEUR(t.amountCents)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
