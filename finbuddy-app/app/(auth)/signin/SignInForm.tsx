"use client";

import { useState } from "react";
import { redirect } from "next/navigation";

export default function SignInForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    console.log("Test");
    e.preventDefault();

    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/signin", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!data?.check) {
      console.log("deb2");
      setErrorMessage(data.error);
      return;
    }

    redirect("/home");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          aria-invalid={errorMessage ? "true" : "false"}
          aria-describedby={errorMessage ? "error-message" : undefined}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-16 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            aria-invalid={errorMessage ? "true" : "false"}
            aria-describedby={errorMessage ? "error-message" : undefined}
          />

          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <p id="error-message" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-white font-semibold shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        Sign in
      </button>
    </form>
  );
}
