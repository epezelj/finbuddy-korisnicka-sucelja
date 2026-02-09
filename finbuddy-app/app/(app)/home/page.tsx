"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  CreditCard,
  Receipt,
  PieChart,
  Target,
  UserPlus,
  Plus,
  Eye,
} from "lucide-react";
import {
  Hero,
  Features,
  PersonaSection,
  HowItWorks,
  FinalCTA,
} from "../../_components/MarketingSections";

type Account = {
  id: string;
  userId: string;
  type: string;
  name: string;
  balanceCents: number;
};

type HomeResponse = {
  accounts: Account[];
  summary: {
    monthStart: string;
    monthEndExclusive: string;
    incomeCents: number;
    expenseCents: number;
    netCents: number;
    balanceCents: number;
  };
};

function fmtEUR(cents: number) {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function AccountCard({ acc }: { acc: Account }) {
  const isCash = acc.type === "cash";
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            isCash ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
          }`}
        >
          {isCash ? (
            <Wallet className="h-5 w-5" />
          ) : (
            <CreditCard className="h-5 w-5" />
          )}
        </div>

        <div className="text-sm font-medium text-gray-600">{acc.name}</div>
      </div>

      <div className="mt-4 text-xl font-semibold text-gray-900">
        {fmtEUR(acc.balanceCents)}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/home", { cache: "no-store" });

      if (res.status === 401) {
        setError("You are not signed in.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Failed to load home.");
        setLoading(false);
        return;
      }

      const json = (await res.json()) as HomeResponse;
      setData(json);
      setLoading(false);
    }

    load();
  }, []);

  const accounts = data?.accounts ?? [];
  const summary = data?.summary;

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-10">Loading…</div>;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-10 text-red-600">{error}</div>;

  return (
    <div className="bg-[#F9FAFB]">
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of your accounts and monthly summary.
          </p>
        </div>

        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accounts</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {accounts.map((acc) => (
              <AccountCard key={acc.id} acc={acc} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Summary</h3>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-blue-200">
              <div className="text-gray-600 text-sm mb-2">Total Income</div>
              <div className="text-green-700 font-semibold">
                {fmtEUR(summary?.incomeCents ?? 0)}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg border border-blue-200">
              <div className="text-gray-600 text-sm mb-2">Total Expense</div>
              <div className="text-red-700 font-semibold">
                {fmtEUR(summary?.expenseCents ?? 0)}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg border border-blue-200">
              <div className="text-gray-600 text-sm mb-2">Net</div>
              <div className="text-blue-700 font-semibold">
                {fmtEUR(summary?.netCents ?? 0)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Hero />
      <Features />
      <PersonaSection />
      <HowItWorks />
      <FinalCTA />
    </div>
  );
}
