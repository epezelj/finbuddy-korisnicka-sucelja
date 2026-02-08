"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type HomeSummary = {
  monthStart: string;
  monthEndExclusive: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  balanceCents: number;
};

type HomeResponse = {
  summary: HomeSummary;
};

type Transaction = {
  id: string;
  kind: "income" | "expense";
  amountCents: number;
  category: string;
  date: string;
};

function fmtEUR(cents: number) {
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function clampLabel(d: string) {
  return d.slice(5);
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const [homeRes, txRes] = await Promise.all([fetch("/api/home"), fetch("/api/transactions")]);

      if (homeRes.status === 401 || txRes.status === 401) {
        setError("You are not signed in.");
        setLoading(false);
        return;
      }
      if (!homeRes.ok) {
        setError("Failed to load monthly summary.");
        setLoading(false);
        return;
      }
      if (!txRes.ok) {
        setError("Failed to load transactions.");
        setLoading(false);
        return;
      }

      const homeJson = (await homeRes.json()) as HomeResponse;
      const txJson = (await txRes.json()) as { transactions: Transaction[] };

      setSummary(homeJson.summary);
      setTxs(txJson.transactions ?? []);
      setLoading(false);
    }

    load();
  }, []);

  const monthTxs = useMemo(() => {
    if (!summary) return txs;
    const start = summary.monthStart;
    const end = summary.monthEndExclusive;
    return txs.filter((t) => t.date >= start && t.date < end);
  }, [txs, summary]);

  const incomeExpenseBar = useMemo(() => {
    const income = summary?.incomeCents ?? 0;
    const expense = summary?.expenseCents ?? 0;
    return [
      { name: "Income", value: income },
      { name: "Expense", value: expense },
    ];
  }, [summary]);

  const dailyNet = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTxs) {
      const delta = t.kind === "income" ? t.amountCents : -t.amountCents;
      map.set(t.date, (map.get(t.date) ?? 0) + delta);
    }

    const rows = [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, netCents]) => ({ date, label: clampLabel(date), netCents }));

    let running = 0;
    return rows.map((r) => {
      running += r.netCents;
      return { ...r, cumulativeCents: running };
    });
  }, [monthTxs]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTxs) {
      if (t.kind !== "expense") continue;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amountCents);
    }
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    return sorted.map(([category, value]) => ({ category, value }));
  }, [monthTxs]);

  const topCategories = categoryData.slice(0, 8);
  const otherSum = categoryData.slice(8).reduce((s, x) => s + x.value, 0);
  const pieData =
    otherSum > 0 ? [...topCategories, { category: "Other", value: otherSum }] : topCategories;

  const pieColors = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#A855F7", "#06B6D4", "#64748B", "#E11D48", "#111827"];

  const stats = useMemo(() => {
    const expenseTxs = monthTxs.filter((t) => t.kind === "expense");
    const incomeTxs = monthTxs.filter((t) => t.kind === "income");

    const avgExpense =
      expenseTxs.length ? Math.round(expenseTxs.reduce((s, t) => s + t.amountCents, 0) / expenseTxs.length) : 0;

    const biggestExpense = expenseTxs.reduce((max, t) => (t.amountCents > max.amountCents ? t : max), {
      id: "0",
      kind: "expense" as const,
      amountCents: 0,
      category: "",
      date: "",
    });

    const biggestIncome = incomeTxs.reduce((max, t) => (t.amountCents > max.amountCents ? t : max), {
      id: "0",
      kind: "income" as const,
      amountCents: 0,
      category: "",
      date: "",
    });

    return { avgExpenseCents: avgExpense, biggestExpense, biggestIncome };
  }, [monthTxs]);

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-10">Loading reports…</div>;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-10 text-red-600">{error}</div>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monthly summary, trends, and category analysis.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-xs text-gray-600">Income (month)</div>
          <div className="mt-2 text-lg font-semibold text-green-700">{fmtEUR(summary?.incomeCents ?? 0)}</div>
          <div className="mt-1 text-xs text-gray-500">{summary?.monthStart} → {summary?.monthEndExclusive}</div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-xs text-gray-600">Expense (month)</div>
          <div className="mt-2 text-lg font-semibold text-red-700">{fmtEUR(summary?.expenseCents ?? 0)}</div>
          <div className="mt-1 text-xs text-gray-500">Avg expense: {fmtEUR(stats.avgExpenseCents)}</div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-xs text-gray-600">Net (month)</div>
          <div className="mt-2 text-lg font-semibold text-blue-700">{fmtEUR(summary?.netCents ?? 0)}</div>
          <div className="mt-1 text-xs text-gray-500">
            Biggest expense: {stats.biggestExpense.amountCents ? fmtEUR(stats.biggestExpense.amountCents) : "—"}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-xs text-gray-600">Total balance</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">{fmtEUR(summary?.balanceCents ?? 0)}</div>
          <div className="mt-1 text-xs text-gray-500">
            Biggest income: {stats.biggestIncome.amountCents ? fmtEUR(stats.biggestIncome.amountCents) : "—"}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2 mb-8">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expense</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpenseBar}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 100)}`} />
                <Tooltip formatter={(v: any) => fmtEUR(Number(v))} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-gray-500">Y-axis shown in cents/approx; hover for exact EUR.</p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cumulative Net Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyNet}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 100)}`} />
                <Tooltip
                  labelFormatter={(l) => `Day: ${l}`}
                  formatter={(v: any) => fmtEUR(Number(v))}
                />
                <Line type="monotone" dataKey="cumulativeCents" dot={false} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-gray-500">Shows how your net position changes through the month.</p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Spending by Category</h2>
          <div className="text-xs text-gray-500">{monthTxs.length} transactions (this month)</div>
        </div>

        {pieData.length === 0 ? (
          <p className="text-sm text-gray-600">No expense transactions for this month yet.</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="category"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmtEUR(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <div className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
                Top categories
              </div>
              <div className="divide-y">
                {categoryData.slice(0, 12).map((c, idx) => (
                  <div key={c.category} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: pieColors[idx % pieColors.length] }}
                      />
                      <span className="truncate text-sm font-medium text-gray-700">{c.category}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{fmtEUR(c.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
