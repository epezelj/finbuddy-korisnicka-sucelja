"use client";
import { useState } from "react";
import { redirect } from "next/navigation";

export default function Page() {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    const formData = new FormData(e.currentTarget);

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // ✅ client-side check
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    const res = await fetch("/api/signup", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.check === "both") {
      setEmailError(data.errorExistEmail);
      setPasswordError(data.errorShortPass);
    }
    if (data.check === "shortPass") {
      setPasswordError(data.error);
    }
    if (data.check === "existEmail") {
      setEmailError(data.error);
    }
    if (data.check === "success") {
      redirect("/signin");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="mx-auto max-w-md px-6 py-12">
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900">
          Sign Up
        </h1>

        <div className="rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border px-3 py-2"
              />
              {emailError && <p className="text-sm text-red-600">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                className="w-full rounded-xl border px-3 py-2"
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            </div>

            {/* ✅ Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                className="w-full rounded-xl border px-3 py-2"
              />
              {confirmPasswordError && (
                <p className="text-sm text-red-600">{confirmPasswordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-white font-semibold"
            >
              Sign Up
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
