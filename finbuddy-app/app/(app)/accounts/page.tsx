"use client";

import { useEffect, useState } from "react";
import { Wallet, CreditCard } from "lucide-react";

type Account = {
  id: string;
  userId: string;
  type: string; // "cash" | "card"
  name: string;
  balanceCents: number;
};

function AccountCard({ acc }: { acc: Account }) {
  const isCash = acc.type === "cash";

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        {/* icon badge */}
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            isCash ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
          }`}
        >
          {isCash ? <Wallet className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
        </div>

        <div className="text-sm font-medium text-gray-600">
          {acc.name}
        </div>
      </div>

      <div className="mt-4 text-xl font-semibold text-gray-900">
        €{(acc.balanceCents / 100).toFixed(2)}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/accounts", { cache: "no-store" });

      if (res.status === 401) {
        setError("You are not signed in.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Failed to load accounts.");
        setLoading(false);
        return;
      }

      const json = await res.json();
      setAccounts(json.accounts ?? []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-10">Loading accounts…</div>;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-10 text-red-600">{error}</div>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Title like screenshot */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Accounts
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your cash and card balances.
        </p>
      </div>

      {/* Cards like screenshot (2 columns on desktop) */}
      <div className="grid gap-6 md:grid-cols-2">
        {accounts.map((acc) => (
          <AccountCard key={acc.id} acc={acc} />
        ))}
      </div>
    </main>
  );
}
