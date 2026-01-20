"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  PlusCircle,
  CreditCard,
  Wallet,
  Pencil,
} from "lucide-react";

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
  date: string;
  note: string | null;
  accountId: string;
  accountName: string;
  accountType: string;
  name: string;
};

function fmtEUR(cents: number) {
  const safe = Number.isFinite(cents) ? cents : 0;
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(safe / 100);
}

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function normalizeType(s: string) {
  return (s || "").trim().toLowerCase();
}

function parseMoneyInputToNumber(s: string) {
  // supports "12.50" and "12,50"
  const normalized = (s ?? "").trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

type FormErrors = Partial<Record<"name" | "amount" | "accountId" | "category" | "date", string>>;

function validateDraft(d: {
  name: string;
  amount: string;
  accountId: string;
  category: string;
  date: string;
}): FormErrors {
  const e: FormErrors = {};
  if (!d.name.trim()) e.name = "Name is required.";
  if (!d.amount.trim()) e.amount = "Amount is required.";
  else {
    const n = parseMoneyInputToNumber(d.amount);
    if (!Number.isFinite(n)) e.amount = "Amount must be a number.";
    else if (n <= 0) e.amount = "Amount must be greater than 0.";
  }
  if (!d.accountId) e.accountId = "Account is required.";
  if (!d.category.trim()) e.category = "Category is required.";
  if (!d.date) e.date = "Date is required.";
  return e;
}

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // page-level banner error (does not hide UI)
  const [error, setError] = useState<string | null>(null);

  // ADD form state
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [transactionName, setTransactionName] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [addErrors, setAddErrors] = useState<FormErrors>({});
  const [adding, setAdding] = useState(false);

  // FILTERS
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // EDIT modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [edit, setEdit] = useState<{
    id: string;
    kind: "income" | "expense";
    name: string;
    amount: string; // EUR input
    accountId: string;
    category: string;
    date: string;
    note: string;
  } | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const aRes = await fetch("/api/accounts", { cache: "no-store" });
      if (aRes.status === 401) {
        setError("You are not signed in.");
        return;
      }
      if (!aRes.ok) {
        setError("Failed to load accounts.");
        return;
      }

      const aJson = await aRes.json().catch(() => ({}));
      const accs: Account[] = Array.isArray(aJson?.accounts) ? aJson.accounts : [];
      setAccounts(accs);

      // default account for add form
      if (!accountId && accs.length) setAccountId(accs[0].id);

      const tRes = await fetch("/api/transactions", { cache: "no-store" });
      if (!tRes.ok) {
        setError("Failed to load transactions.");
        return;
      }
      const tJson = await tRes.json().catch(() => ({}));
      setTxs(Array.isArray(tJson?.transactions) ? tJson.transactions : []);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const balances = useMemo(() => {
    const list = Array.isArray(accounts) ? accounts : [];
    const cash = list
      .filter((a) => {
        const t = normalizeType(a?.type);
        return t === "cash" || t.includes("cash");
      })
      .reduce((sum, a) => sum + (Number.isFinite(a?.balanceCents) ? a.balanceCents : 0), 0);

    const card = list
      .filter((a) => {
        const t = normalizeType(a?.type);
        return t === "card" || t.includes("card");
      })
      .reduce((sum, a) => sum + (Number.isFinite(a?.balanceCents) ? a.balanceCents : 0), 0);

    return { cash, card };
  }, [accounts]);

  const filteredTxs = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const catNeedle = categoryFilter.trim().toLowerCase();

    return (txs ?? []).filter((t) => {
      const name = (t?.name ?? "").toLowerCase();
      const cat = (t?.category ?? "").toLowerCase();
      const d = t?.date ?? "";
      if (needle && !name.includes(needle)) return false;
      if (catNeedle && !cat.includes(catNeedle)) return false;
      if (fromDate && d && d < fromDate) return false;
      if (toDate && d && d > toDate) return false;
      return true;
    });
  }, [txs, q, categoryFilter, fromDate, toDate]);

  const hasAnyFilter = Boolean(q.trim() || categoryFilter.trim() || fromDate || toDate);

  function clearFilters() {
    setQ("");
    setCategoryFilter("");
    setFromDate("");
    setToDate("");
  }

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <div className="mt-1 text-xs font-semibold text-rose-600">{msg}</div> : null;

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errs = validateDraft({
      name: transactionName,
      amount,
      accountId,
      category,
      date,
    });
    setAddErrors(errs);
    if (Object.keys(errs).length) return;

    const num = parseMoneyInputToNumber(amount);
    if (!Number.isFinite(num)) {
      setAddErrors((p) => ({ ...p, amount: "Amount must be a number." }));
      return;
    }

    setAdding(true);
    try {
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
          name: transactionName.trim(),
        }),
      });

      if (res.status === 401) {
        setError("You are not signed in.");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? "Failed to add transaction.");
        return;
      }

      // reset (keep account selected)
      setTransactionName("");
      setAmount("");
      setNote("");
      setAddErrors({});
      await loadAll();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  function openEdit(t: Transaction) {
    setError(null);
    setEditErrors({});
    setEdit({
      id: t.id,
      kind: t.kind,
      name: t.name ?? "",
      amount: String((Number.isFinite(t.amountCents) ? t.amountCents : 0) / 100),
      accountId: t.accountId,
      category: t.category ?? "",
      date: t.date ?? new Date().toISOString().slice(0, 10),
      note: t.note ?? "",
    });
    setIsEditOpen(true);
  }

  function closeEdit() {
    if (editSaving) return;
    setIsEditOpen(false);
    setEdit(null);
    setEditErrors({});
  }

  async function updateTransaction(id: string, payload: any) {
    const res = await fetch("/api/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });

    if (res.status === 401) return { ok: false as const, err: "You are not signed in." };
    if (res.ok) return { ok: true as const, err: null };

    const j = await res.json().catch(() => ({}));
    return { ok: false as const, err: j?.error ?? "Failed to update transaction." };
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;

    setError(null);

    const errs = validateDraft({
      name: edit.name,
      amount: edit.amount,
      accountId: edit.accountId,
      category: edit.category,
      date: edit.date,
    });
    setEditErrors(errs);
    if (Object.keys(errs).length) return;

    const num = parseMoneyInputToNumber(edit.amount);
    if (!Number.isFinite(num)) {
      setEditErrors((p) => ({ ...p, amount: "Amount must be a number." }));
      return;
    }

    setEditSaving(true);

    const payload = {
      kind: edit.kind,
      amount: num,
      accountId: edit.accountId,
      category: edit.category.trim(),
      date: edit.date,
      note: edit.note.trim() ? edit.note.trim() : null,
      name: edit.name.trim(),
    };

    const result = await updateTransaction(edit.id, payload);

    if (!result.ok) {
      setError(result.err ?? "Failed to update transaction.");
      setEditSaving(false);
      return;
    }

    await loadAll();
    setEditSaving(false);
    closeEdit();
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-10">Loading…</div>;

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-sky-50 to-emerald-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Transactions</h1>
            <p className="mt-1 text-sm text-gray-600">Track, add and edit transactions.</p>
          </div>

          {hasAnyFilter ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-xl border bg-white/70 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur hover:bg-white"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Error banner (no early return) */}
        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {/* Balances (small / not dominant) */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/75 p-5 shadow-sm ring-1 ring-white/60 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                  <CreditCard className="h-5 w-5 text-indigo-700" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500">Card</div>
                  <div className="text-sm font-extrabold text-gray-900">{fmtEUR(balances.card)}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Balance</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/75 p-5 shadow-sm ring-1 ring-white/60 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                  <Wallet className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500">Cash</div>
                  <div className="text-sm font-extrabold text-gray-900">{fmtEUR(balances.cash)}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Balance</div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-8 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-white/60 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Search</div>
              <Search className="h-4 w-4 text-gray-400" />
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-indigo-200">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Search by transaction name…"
              />
              {q ? (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-white/70 to-indigo-50 p-5 shadow-sm ring-1 ring-white/60 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
                <div className="text-sm font-semibold text-gray-900">Filters</div>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasAnyFilter}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-indigo-200">
                <div className="text-[11px] font-semibold text-gray-500">From</div>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-indigo-200">
                <div className="text-[11px] font-semibold text-gray-500">To</div>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-indigo-200">
                <div className="text-[11px] font-semibold text-gray-500">Category</div>
                <input
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Food, Salary…"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add transaction (Add button bottom) */}
        <form
          onSubmit={addTransaction}
          className="mb-8 overflow-hidden rounded-2xl bg-white/75 shadow-lg ring-1 ring-white/60 backdrop-blur"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-sky-600 px-6 py-4 text-white">
            <div className="text-sm font-semibold">Add transaction</div>
            <div className="text-xs text-white/80">Fields marked * are required</div>
          </div>

          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-6">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-600">
                  Name <span className="text-rose-600">*</span>
                </label>
                <input
                  value={transactionName}
                  onChange={(e) => {
                    setTransactionName(e.target.value);
                    setAddErrors((p) => ({ ...p, name: undefined }));
                  }}
                  className={cx(
                    "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm focus:ring-4",
                    addErrors.name ? "border-rose-300 focus:ring-rose-100" : "border-gray-200 focus:ring-indigo-200"
                  )}
                  placeholder="e.g. Grocery shopping"
                />
                <FieldError msg={addErrors.name} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Type</label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-4 focus:ring-indigo-200"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Amount <span className="text-rose-600">*</span>
                </label>
                <input
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAddErrors((p) => ({ ...p, amount: undefined }));
                  }}
                  inputMode="decimal"
                  placeholder="12.50"
                  className={cx(
                    "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm focus:ring-4",
                    addErrors.amount ? "border-rose-300 focus:ring-rose-100" : "border-gray-200 focus:ring-indigo-200"
                  )}
                />
                <FieldError msg={addErrors.amount} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Account <span className="text-rose-600">*</span>
                </label>
                <select
                  value={accountId}
                  onChange={(e) => {
                    setAccountId(e.target.value);
                    setAddErrors((p) => ({ ...p, accountId: undefined }));
                  }}
                  className={cx(
                    "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm focus:ring-4",
                    addErrors.accountId
                      ? "border-rose-300 focus:ring-rose-100"
                      : "border-gray-200 focus:ring-indigo-200"
                  )}
                >
                  <option value="">Select an account…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
                <FieldError msg={addErrors.accountId} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Category <span className="text-rose-600">*</span>
                </label>
                <input
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setAddErrors((p) => ({ ...p, category: undefined }));
                  }}
                  className={cx(
                    "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm focus:ring-4",
                    addErrors.category
                      ? "border-rose-300 focus:ring-rose-100"
                      : "border-gray-200 focus:ring-indigo-200"
                  )}
                  placeholder="Food, Salary…"
                />
                <FieldError msg={addErrors.category} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Date <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setAddErrors((p) => ({ ...p, date: undefined }));
                  }}
                  className={cx(
                    "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm focus:ring-4",
                    addErrors.date ? "border-rose-300 focus:ring-rose-100" : "border-gray-200 focus:ring-indigo-200"
                  )}
                />
                <FieldError msg={addErrors.date} />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-600">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-4 focus:ring-indigo-200"
                placeholder="e.g. groceries at Konzum"
              />
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                type="submit"
                disabled={adding}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                <PlusCircle className="h-4 w-4" />
                {adding ? "Adding…" : "Add transaction"}
              </button>
            </div>
          </div>
        </form>

        {/* Transactions list with Edit */}
        <div className="rounded-2xl bg-white/75 shadow-lg ring-1 ring-white/60 backdrop-blur">
          <div className="flex items-center justify-between border-b border-gray-200/70 px-6 py-4">
            <div>
              <div className="text-sm font-extrabold text-gray-900">All transactions</div>
              <div className="text-xs text-gray-500">Click edit to update a transaction.</div>
            </div>
          </div>

          {filteredTxs.length === 0 ? (
            <div className="px-6 py-10 text-sm text-gray-600">No transactions match your search/filters.</div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="grid gap-3">
                {filteredTxs.map((t) => (
                  <div
                    key={t.id}
                    className="group rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-extrabold text-gray-900">{t.name}</span>

                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                            {t.category}
                          </span>

                          <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-100">
                            {t.accountName} ({t.accountType})
                          </span>

                          <span className="text-xs font-medium text-gray-500">{t.date}</span>
                        </div>

                        {t.note ? (
                          <div className="mt-2 line-clamp-1 text-xs text-gray-600">{t.note}</div>
                        ) : (
                          <div className="mt-2 text-xs text-gray-400">No note</div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={cx(
                            "text-sm font-extrabold",
                            t.kind === "income" ? "text-emerald-700" : "text-rose-700"
                          )}
                        >
                          {t.kind === "income" ? "+" : "-"}
                          {fmtEUR(t.amountCents)}
                        </div>

                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="inline-flex items-center gap-2 rounded-xl border bg-white/80 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-white"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {isEditOpen && edit ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeEdit} />
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <div className="text-sm font-extrabold text-gray-900">Edit transaction</div>
                  <div className="text-xs text-gray-500">Fields marked * are required</div>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={editSaving}
                  className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={saveEdit} className="p-6">
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">
                      Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      value={edit.name}
                      onChange={(e) => {
                        setEdit((d) => (d ? { ...d, name: e.target.value } : d));
                        setEditErrors((p) => ({ ...p, name: undefined }));
                      }}
                      className={cx(
                        "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm focus:ring-4",
                        editErrors.name ? "border-rose-300 focus:ring-rose-100" : "border-gray-200 focus:ring-indigo-200"
                      )}
                    />
                    <FieldError msg={editErrors.name} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Type</label>
                    <select
                      value={edit.kind}
                      onChange={(e) => setEdit((d) => (d ? { ...d, kind: e.target.value as any } : d))}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-4 focus:ring-indigo-200"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Amount <span className="text-rose-600">*</span>
                    </label>
                    <input
                      value={edit.amount}
                      onChange={(e) => {
                        setEdit((d) => (d ? { ...d, amount: e.target.value } : d));
                        setEditErrors((p) => ({ ...p, amount: undefined }));
                      }}
                      className={cx(
                        "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm focus:ring-4",
                        editErrors.amount ? "border-rose-300 focus:ring-rose-100" : "border-gray-200 focus:ring-indigo-200"
                      )}
                    />
                    <FieldError msg={editErrors.amount} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Account <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={edit.accountId}
                      onChange={(e) => {
                        setEdit((d) => (d ? { ...d, accountId: e.target.value } : d));
                        setEditErrors((p) => ({ ...p, accountId: undefined }));
                      }}
                      className={cx(
                        "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm focus:ring-4",
                        editErrors.accountId
                          ? "border-rose-300 focus:ring-rose-100"
                          : "border-gray-200 focus:ring-indigo-200"
                      )}
                    >
                      <option value="">Select an account…</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                    <FieldError msg={editErrors.accountId} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Category <span className="text-rose-600">*</span>
                    </label>
                    <input
                      value={edit.category}
                      onChange={(e) => {
                        setEdit((d) => (d ? { ...d, category: e.target.value } : d));
                        setEditErrors((p) => ({ ...p, category: undefined }));
                      }}
                      className={cx(
                        "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm focus:ring-4",
                        editErrors.category
                          ? "border-rose-300 focus:ring-rose-100"
                          : "border-gray-200 focus:ring-indigo-200"
                      )}
                    />
                    <FieldError msg={editErrors.category} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Date <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={edit.date}
                      onChange={(e) => {
                        setEdit((d) => (d ? { ...d, date: e.target.value } : d));
                        setEditErrors((p) => ({ ...p, date: undefined }));
                      }}
                      className={cx(
                        "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm focus:ring-4",
                        editErrors.date ? "border-rose-300 focus:ring-rose-100" : "border-gray-200 focus:ring-indigo-200"
                      )}
                    />
                    <FieldError msg={editErrors.date} />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold text-gray-600">Note (optional)</label>
                  <input
                    value={edit.note}
                    onChange={(e) => setEdit((d) => (d ? { ...d, note: e.target.value } : d))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-4 focus:ring-indigo-200"
                  />
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={editSaving}
                    className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={editSaving}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {editSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
