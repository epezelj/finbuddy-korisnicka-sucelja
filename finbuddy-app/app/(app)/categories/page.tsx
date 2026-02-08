"use client";

import { useEffect, useMemo, useState } from "react";

type CategoryType = "expense" | "income";

type Category = {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string;
  monthlyLimitCents: number | null;
  createdAt: string;
};

type Transaction = {
  id: string;
  kind: "income" | "expense";
  amountCents: number;
  category: string;
  date: string;
  note: string | null;
};

function fmtEUR(cents: number) {
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function toCentsFromEURInput(value: string): number | null {
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function monthRange(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 1));
  const toYMD = (d: Date) => d.toISOString().slice(0, 10);
  return { startYMD: toYMD(start), endYMD: toYMD(end) };
}

function normalizeCategoryName(input: string) {
  const s = input.trim().replace(/\s+/g, " ");
  if (!s) return "";
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const DEFAULT_COLORS = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#A855F7", "#06B6D4", "#64748B", "#E11D48"];

type SortKey = "A-Z" | "Most used" | "Most this month" | "Over limit";

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<CategoryType>("expense");
  const [addLimitEUR, setAddLimitEUR] = useState<string>("");
  const [showSuggest, setShowSuggest] = useState(false);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("A-Z");
  const [typeFilter, setTypeFilter] = useState<"all" | CategoryType>("all");

  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<CategoryType>("expense");
  const [editColor, setEditColor] = useState("#2563EB");
  const [editLimitEUR, setEditLimitEUR] = useState<string>("");

  async function loadAll() {
    setLoading(true);
    setError(null);

    const [cRes, tRes] = await Promise.all([fetch("/api/categories"), fetch("/api/transactions")]);

    if (cRes.status === 401 || tRes.status === 401) {
      setError("You are not signed in.");
      setLoading(false);
      return;
    }

    if (!cRes.ok) {
      setError("Failed to load categories.");
      setLoading(false);
      return;
    }
    if (!tRes.ok) {
      setError("Failed to load transactions.");
      setLoading(false);
      return;
    }

    const cJson = (await cRes.json()) as { categories: Category[] };
    const tJson = (await tRes.json()) as { transactions: Transaction[] };

    const normalizedCats = (cJson.categories ?? []).map((c) => ({
      ...c,
      name: normalizeCategoryName(c.name),
    }));
    const normalizedTxs = (tJson.transactions ?? []).map((t) => ({
      ...t,
      category: normalizeCategoryName(t.category),
    }));

    setCats(normalizedCats);
    setTxs(normalizedTxs);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const { startYMD, endYMD } = useMemo(() => monthRange(new Date()), []);
  const monthTxs = useMemo(() => txs.filter((t) => t.date >= startYMD && t.date < endYMD), [txs, startYMD, endYMD]);

  const statsByName = useMemo(() => {
    const map = new Map<string, { count: number; expenseCents: number; incomeCents: number; netCents: number }>();
    for (const t of monthTxs) {
      const key = normalizeCategoryName(t.category);
      const cur = map.get(key) ?? { count: 0, expenseCents: 0, incomeCents: 0, netCents: 0 };
      cur.count += 1;
      if (t.kind === "expense") cur.expenseCents += t.amountCents;
      if (t.kind === "income") cur.incomeCents += t.amountCents;
      cur.netCents = cur.incomeCents - cur.expenseCents;
      map.set(key, cur);
    }
    return map;
  }, [monthTxs]);

  const inferredNames = useMemo(() => {
    const set = new Set<string>();
    for (const t of txs) set.add(normalizeCategoryName(t.category));
    for (const c of cats) set.delete(normalizeCategoryName(c.name));
    return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [txs, cats]);

  const suggestions = useMemo(() => {
    const needle = normalizeCategoryName(addName).toLowerCase();
    if (!needle) return [];

    const all = [
      ...new Set([
        ...inferredNames.map(normalizeCategoryName),
        ...cats.map((c) => normalizeCategoryName(c.name)),
      ]),
    ];

    return all
      .filter((n) => n.toLowerCase().includes(needle))
      .slice(0, 7);
  }, [addName, inferredNames, cats]);

  const addPreview = useMemo(() => {
    const name = normalizeCategoryName(addName);
    if (!name) return null;
    const st = statsByName.get(name) ?? { count: 0, expenseCents: 0, incomeCents: 0, netCents: 0 };
    const alreadySaved = cats.some((c) => normalizeCategoryName(c.name) === name);
    return { name, ...st, alreadySaved };
  }, [addName, statsByName, cats]);

  const mergedRows = useMemo(() => {
    const stored = cats.map((c) => {
      const nm = normalizeCategoryName(c.name);
      const st = statsByName.get(nm) ?? { count: 0, expenseCents: 0, incomeCents: 0, netCents: 0 };
      const limit = c.type === "expense" ? c.monthlyLimitCents : null;
      const pct = limit && limit > 0 ? Math.min(1, st.expenseCents / limit) : 0;
      const over = !!(limit && limit > 0 && st.expenseCents > limit);

      return {
        kind: "stored" as const,
        id: c.id,
        name: nm,
        type: c.type,
        color: c.color || "#2563EB",
        monthlyLimitCents: c.monthlyLimitCents,
        count: st.count,
        expenseCents: st.expenseCents,
        incomeCents: st.incomeCents,
        netCents: st.netCents,
        pct,
        over,
      };
    });

    const inferred = inferredNames.map((name) => {
      const st = statsByName.get(name) ?? { count: 0, expenseCents: 0, incomeCents: 0, netCents: 0 };
      const guessType: CategoryType = st.expenseCents >= st.incomeCents ? "expense" : "income";
      return {
        kind: "inferred" as const,
        id: `inferred:${name}`,
        name,
        type: guessType,
        color: "#64748B",
        monthlyLimitCents: null,
        count: st.count,
        expenseCents: st.expenseCents,
        incomeCents: st.incomeCents,
        netCents: st.netCents,
        pct: 0,
        over: false,
      };
    });

    return [...stored, ...inferred];
  }, [cats, inferredNames, statsByName]);

  const filteredSorted = useMemo(() => {
    const needle = q.trim().toLowerCase();

    let rows = mergedRows.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (!needle) return true;
      return r.name.toLowerCase().includes(needle);
    });

    rows.sort((a, b) => {
      if (sort === "A-Z") return a.name.localeCompare(b.name);
      if (sort === "Most used") return (b.count - a.count) || a.name.localeCompare(b.name);
      if (sort === "Most this month") {
        const aVal = a.type === "expense" ? a.expenseCents : a.incomeCents;
        const bVal = b.type === "expense" ? b.expenseCents : b.incomeCents;
        return (bVal - aVal) || a.name.localeCompare(b.name);
      }
      if (sort === "Over limit") {
        const ao = a.over ? 1 : 0;
        const bo = b.over ? 1 : 0;
        return (bo - ao) || (b.expenseCents - a.expenseCents) || a.name.localeCompare(b.name);
      }
      return 0;
    });

    return rows;
  }, [mergedRows, q, sort, typeFilter]);

  async function addCategory() {
    const name = normalizeCategoryName(addName);
    if (!name) {
      setError("Enter a category name.");
      return;
    }

    setBusy(true);
    setError(null);

    const monthlyLimitCents =
      addType === "expense" && addLimitEUR.trim()
        ? toCentsFromEURInput(addLimitEUR.trim())
        : null;

    if (addType === "expense" && addLimitEUR.trim() && monthlyLimitCents === null) {
      setBusy(false);
      setError("Monthly limit must be a valid number.");
      return;
    }

    const color = DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type: addType,
        color,
        monthlyLimitCents,
      }),
    });

    if (res.status === 401) {
      setBusy(false);
      setError("You are not signed in.");
      return;
    }

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setBusy(false);
      setError(j.error ?? "Failed to add category.");
      return;
    }

    setAddName("");
    setAddLimitEUR("");
    await loadAll();
    setBusy(false);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setEditName(c.name);
    setEditType(c.type);
    setEditColor(c.color || "#2563EB");
    setEditLimitEUR(c.monthlyLimitCents != null ? (c.monthlyLimitCents / 100).toFixed(2) : "");
  }

  async function saveEdit() {
    if (!editing) return;

    const name = normalizeCategoryName(editName);
    if (!name) {
      setError("Category name is required.");
      return;
    }

    const monthlyLimitCents =
      editType === "expense" && editLimitEUR.trim()
        ? toCentsFromEURInput(editLimitEUR.trim())
        : null;

    if (editType === "expense" && editLimitEUR.trim() && monthlyLimitCents === null) {
      setError("Monthly limit must be a valid number.");
      return;
    }

    setBusy(true);
    setError(null);

    const res = await fetch(`/api/categories?id=${encodeURIComponent(editing.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type: editType,
        color: editColor,
        monthlyLimitCents,
      }),
    });

    if (res.status === 401) {
      setBusy(false);
      setError("You are not signed in.");
      return;
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setBusy(false);
      setError(j.error ?? "Failed to update category.");
      return;
    }

    setEditing(null);
    await loadAll();
    setBusy(false);
  }

  async function deleteCategory(c: Category) {
    const ok = window.confirm(`Delete category "${c.name}"?`);
    if (!ok) return;

    setBusy(true);
    setError(null);

    const res = await fetch(`/api/categories?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });

    if (res.status === 401) {
      setBusy(false);
      setError("You are not signed in.");
      return;
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setBusy(false);
      setError(j.error ?? "Failed to delete category.");
      return;
    }

    await loadAll();
    setBusy(false);
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-10">Loading categories…</div>;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-10 text-red-600">{error}</div>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create categories, set monthly limits (expenses), and see usage & spending for this month.
          </p>
        </div>

        <div className="text-xs text-gray-500">
          This month: <span className="font-semibold text-gray-700">{startYMD}</span> →{" "}
          <span className="font-semibold text-gray-700">{endYMD}</span>
        </div>
      </div>

      <section className="mb-6 grid gap-4 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-12">
        <div className="md:col-span-5">
          <label className="text-xs font-medium text-gray-600">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search categories…"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="md:col-span-3">
          <label className="text-xs font-medium text-gray-600">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            <option value="all">All</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="md:col-span-4">
          <label className="text-xs font-medium text-gray-600">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            <option value="A-Z">A-Z</option>
            <option value="Most used">Most used</option>
            <option value="Most this month">Most this month</option>
            <option value="Over limit">Over limit</option>
          </select>
        </div>
      </section>

      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Add category</h2>
          <span className="text-xs text-gray-500">Tip: start typing to pick from transactions</span>
        </div>

        <div className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="text-xs font-medium text-gray-600">Name</label>

            <div className="relative">
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
                placeholder="e.g. Coffee, Rent, Family expenses"
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />

              {showSuggest && suggestions.length > 0 ? (
                <div className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow-lg overflow-hidden">
                  {suggestions.map((s) => {
                    const isSaved = cats.some((c) => normalizeCategoryName(c.name) === s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setAddName(s);
                          setShowSuggest(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        {s}
                        <span className="ml-2 text-xs text-gray-500">
                          {isSaved ? "(already saved)" : "(from transactions)"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {addPreview ? (
              <div className="mt-2 text-xs text-gray-600">
                This month: used <span className="font-semibold">{addPreview.count}</span>x • spent{" "}
                <span className="font-semibold">{fmtEUR(addPreview.expenseCents)}</span>
                {addPreview.alreadySaved ? (
                  <span className="ml-2 text-gray-500">(already exists in Categories)</span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-medium text-gray-600">Type</label>
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as CategoryType)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-medium text-gray-600">Monthly limit (EUR)</label>
            <input
              value={addLimitEUR}
              onChange={(e) => setAddLimitEUR(e.target.value)}
              placeholder={addType === "expense" ? "e.g. 200" : "—"}
              disabled={addType !== "expense"}
              className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {inferredNames.length > 0 ? (
            <div className="text-xs text-gray-600">
              You have <span className="font-semibold">{inferredNames.length}</span> category name(s) used in transactions
              that aren’t saved yet.
            </div>
          ) : (
            <div />
          )}

          <button
            onClick={addCategory}
            disabled={busy}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            Add Category
          </button>
        </div>
      </section>

      <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">All categories</div>
          <div className="text-xs text-gray-500">{filteredSorted.length} items</div>
        </div>

        <div className="divide-y">
          {filteredSorted.length === 0 ? (
            <div className="px-6 py-10 text-sm text-gray-600">No categories found.</div>
          ) : (
            filteredSorted.map((r) => {
              const isExpense = r.type === "expense";
              const spentOrEarned = isExpense ? r.expenseCents : r.incomeCents;

              const limit = isExpense ? r.monthlyLimitCents : null;
              const showLimit = isExpense && r.kind === "stored" && limit != null && limit > 0;

              const pct = showLimit ? Math.min(1, spentOrEarned / (limit as number)) : 0;
              const over = showLimit ? spentOrEarned > (limit as number) : false;
              const warn = showLimit ? spentOrEarned >= 0.8 * (limit as number) : false;

              return (
                <div key={r.id} className="px-6 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex items-start gap-3">
                      <span className="mt-1 h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm font-semibold text-gray-900 truncate">{r.name}</div>

                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              isExpense
                                ? "border-red-200 text-red-700 bg-red-50"
                                : "border-green-200 text-green-700 bg-green-50"
                            }`}
                          >
                            {isExpense ? "Expense" : "Income"}
                          </span>

                          {r.kind === "inferred" ? (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 bg-gray-50">
                              From transactions
                            </span>
                          ) : null}

                          {over ? (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-red-200 text-red-700 bg-red-50">
                              Over limit
                            </span>
                          ) : warn ? (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-yellow-200 text-yellow-700 bg-yellow-50">
                              Near limit
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Used {r.count} time(s) this month • Net:{" "}
                          <span className={r.netCents >= 0 ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                            {fmtEUR(r.netCents)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2">
                      <div className="text-sm font-semibold text-gray-900">
                        {isExpense ? "Spent: " : "Earned: "}
                        {fmtEUR(spentOrEarned)}
                      </div>

                      {showLimit ? (
                        <div className="w-full md:w-64">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Limit: {fmtEUR(limit as number)}</span>
                            <span>{Math.round(pct * 100)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={over ? "h-full bg-red-500" : warn ? "h-full bg-yellow-500" : "h-full bg-blue-600"}
                              style={{ width: `${Math.max(2, pct * 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">{isExpense && r.kind === "stored" ? "No monthly limit" : "—"}</div>
                      )}

                      {r.kind === "stored" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(cats.find((c) => c.id === r.id)!)}
                            className="rounded-lg border px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteCategory(cats.find((c) => c.id === r.id)!)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">Add this category to manage color/limit.</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Edit category</div>
              <button onClick={() => setEditing(null)} className="text-sm font-semibold text-gray-600 hover:text-gray-900">
                Close
              </button>
            </div>

            <div className="px-6 py-5 grid gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gray-600">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as CategoryType)}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <div className="mt-1 text-xs text-gray-500">Limit applies to expense only.</div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Monthly limit (EUR)</label>
                  <input
                    value={editLimitEUR}
                    onChange={(e) => setEditLimitEUR(e.target.value)}
                    disabled={editType !== "expense"}
                    placeholder={editType === "expense" ? "e.g. 200" : "—"}
                    className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">Color</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DEFAULT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`h-8 w-8 rounded-full border ${editColor === c ? "ring-2 ring-offset-2 ring-blue-600" : ""}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="h-8 w-12 rounded border" title="Custom color" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
              <button onClick={() => setEditing(null)} className="rounded-lg border px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
