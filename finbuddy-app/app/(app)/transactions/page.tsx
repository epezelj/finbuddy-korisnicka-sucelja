"use client";

import React, { useEffect, useMemo, useState } from "react";

type Account = {
  id: string;
  type: string;
  name: string;
  balanceCents: number;
};

type Transaction = {
  id: string;
  kind: "income" | "expense";
  amountCents: number;
  category: string;
  date: string; // YYYY-MM-DD
  note: string | null;
  accountId: string;
  accountName: string;
  accountType: string;
  name: string;
};

function fmtEUR(cents: number) {
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function paymentLabel(accountType: string) {
  const t = (accountType || "").toLowerCase();
  if (t.includes("cash")) return "Cash";
  if (t.includes("card")) return "Card";
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "—";
}

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Form state
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [name, setName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [category, setCategory] = useState<string>("Food");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>("");

  // ✅ Filters
  const [qName, setQName] = useState<string>("");
  const [qCategory, setQCategory] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>(""); // YYYY-MM-DD

  // Load more
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const total = useMemo(() => {
    return txs.reduce((acc, t) => acc + (t.kind === "income" ? t.amountCents : -t.amountCents), 0);
  }, [txs]);

  // Newest first
  const sortedTxs = useMemo(() => {
    return [...txs].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [txs]);

  // ✅ Filtered list
  const filteredTxs = useMemo(() => {
    const nameQ = qName.trim().toLowerCase();
    const catQ = qCategory.trim().toLowerCase();

    return sortedTxs.filter((t) => {
      const matchesName =
        !nameQ || (t.name || "").toLowerCase().includes(nameQ);

      const matchesCategory =
        !catQ || (t.category || "").toLowerCase().includes(catQ);

      // date range (YYYY-MM-DD compares lexicographically)
      const matchesStart = !startDate || t.date >= startDate;
      const matchesEnd = !endDate || t.date <= endDate;

      return matchesName && matchesCategory && matchesStart && matchesEnd;
    });
  }, [sortedTxs, qName, qCategory, startDate, endDate]);

  const visibleTxs = useMemo(() => filteredTxs.slice(0, visibleCount), [filteredTxs, visibleCount]);
  const canLoadMore = visibleCount < filteredTxs.length;

  async function loadAll() {
    setLoading(true);
    setLoadError(null);

    try {
      const aRes = await fetch("/api/accounts", { cache: "no-store" });
      if (aRes.status === 401) {
        setLoadError("You are not signed in.");
        setAccounts([]);
        setTxs([]);
        setLoading(false);
        return;
      }

      if (!aRes.ok) {
        setLoadError("Failed to load accounts.");
        setAccounts([]);
      } else {
        const aJson = await aRes.json();
        const accs: Account[] = aJson.accounts ?? [];
        setAccounts(accs);
        if (!accountId && accs.length) setAccountId(accs[0].id);
      }

      const tRes = await fetch("/api/transactions", { cache: "no-store" });
      if (!tRes.ok) {
        setLoadError((prev) => prev ?? "Failed to load transactions.");
        setTxs([]);
      } else {
        const tJson = await tRes.json();
        setTxs(tJson.transactions ?? []);
      }
    } catch {
      setLoadError("Network error while loading data.");
      setAccounts([]);
      setTxs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset pagination when list changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [txs.length]);

  // ✅ Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [qName, qCategory, startDate, endDate]);

  // ✅ Enforce endDate >= startDate (start should be older than end)
  useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();

    setFormError(null);
    setAmountError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setFormError("Transaction name is required.");
      return;
    }

    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setAmountError("Amount must be a positive number.");
      return;
    }

    if (!accountId) {
      setFormError("Choose an account.");
      return;
    }

    if (!category.trim()) {
      setFormError("Choose a category.");
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: cleanName,
          amount: num,
          accountId,
          category: category.trim(),
          date,
          note: note.trim() ? note.trim() : null,
        }),
      });

      if (res.status === 401) {
        setFormError("You are not signed in.");
        return;
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setFormError(j.error ?? "Failed to add transaction.");
        return;
      }

      const j = await res.json().catch(() => null);
      const created: Transaction | null = j?.transaction ?? null;

      if (created) {
        setTxs((prev) => [created, ...prev]);
        setVisibleCount(PAGE_SIZE);
      } else {
        await loadAll();
      }

      setName("");
      setAmount("");
      setNote("");
    } catch {
      setFormError("Network error while adding transaction.");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
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

      {loadError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {/* Add Transaction Form */}
      <form onSubmit={addTransaction} className="mb-6 rounded-xl border bg-gray-50 p-6 shadow-lg">
        <div className="grid gap-4 md:grid-cols-6">
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

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-600">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-blue-300 focus:ring-4 focus:ring-blue-500 px-3 py-2"
              placeholder="e.g. Groceries, Salary…"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Amount</label>
            <input
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setAmountError(null);
              }}
              inputMode="decimal"
              placeholder="e.g. 12.50"
              className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-4 focus:ring-blue-500 ${
                amountError ? "border-red-400" : "border-blue-300"
              }`}
            />
            {amountError ? <p className="mt-1 text-xs text-red-600">{amountError}</p> : null}
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
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <div>
            <label className="text-xs font-medium text-gray-600">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-blue-300 focus:ring-4 focus:ring-blue-500 px-3 py-2"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-medium text-gray-600">Description (optional)</label>
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
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 disabled:opacity-60"
            >
              + Add
            </button>
          </div>
        </div>

        {formError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        ) : null}
      </form>

      {/* ✅ Filters */}
      <div className="mb-6 rounded-xl border bg-white p-6 shadow-lg">
        <div className="mb-3 text-sm font-semibold text-gray-900">Search & Filters</div>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Search name</label>
            <input
              value={qName}
              onChange={(e) => setQName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-blue-300 px-3 py-2 focus:ring-4 focus:ring-blue-500"
              placeholder="e.g. rent, groceries…"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Category</label>
            <input
              value={qCategory}
              onChange={(e) => setQCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-blue-300 px-3 py-2 focus:ring-4 focus:ring-blue-500"
              placeholder="e.g. Food"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-blue-300 px-3 py-2 focus:ring-4 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">End date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined} // prevents endDate older than startDate
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-blue-300 px-3 py-2 focus:ring-4 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-600">
            Showing <span className="font-semibold">{Math.min(visibleCount, filteredTxs.length)}</span> of{" "}
            <span className="font-semibold">{filteredTxs.length}</span> results
          </div>

          <button
            type="button"
            onClick={() => {
              setQName("");
              setQCategory("");
              setStartDate("");
              setEndDate("");
            }}
            className="rounded-lg border border-blue-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-gray-100 focus:ring-4 focus:ring-blue-500"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="rounded-xl border border-blue-300 bg-white shadow-lg overflow-hidden">
        <div className="border-b px-6 py-4 text-sm font-semibold text-gray-900 flex items-center justify-between">
          <span>All Transactions</span>
          <span className="text-xs font-medium text-gray-500">
            Showing {Math.min(visibleCount, filteredTxs.length)} / {filteredTxs.length}
          </span>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="px-6 py-10 text-sm text-gray-600">Loading…</div>
          ) : visibleTxs.length === 0 ? (
            <div className="px-6 py-10 text-sm text-gray-600">No transactions match your filters.</div>
          ) : (
            visibleTxs.map((t) => (
              <div
                key={t.id}
                className="px-6 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-start justify-between gap-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 truncate">{t.name}</div>
                  {t.note ? <div className="mt-0.5 text-xs text-gray-500 truncate">{t.note}</div> : null}

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-white border px-2 py-0.5">{t.date}</span>
                    <span className="rounded-full bg-white border px-2 py-0.5">{paymentLabel(t.accountType)}</span>
                    <span className="rounded-full bg-white border px-2 py-0.5">{t.category}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className={`text-sm font-bold ${t.kind === "income" ? "text-green-700" : "text-red-700"}`}>
                    {t.kind === "income" ? "+" : "-"}
                    {fmtEUR(t.amountCents)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{t.kind === "income" ? "Income" : "Expense"}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {canLoadMore ? (
          <div className="px-6 py-4 bg-white">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="w-full rounded-lg border border-blue-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-gray-100 focus:ring-4 focus:ring-blue-500"
            >
              Load more ({Math.min(PAGE_SIZE, filteredTxs.length - visibleCount)} more)
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
