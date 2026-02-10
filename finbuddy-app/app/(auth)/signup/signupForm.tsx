"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const router = useRouter();

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    const formData = new FormData(e.currentTarget);

    const password = (formData.get("password") as string) || "";
    const confirmPassword = (formData.get("confirmPassword") as string) || "";

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
      return;
    }
    if (data.check === "shortPass") {
      setPasswordError(data.error);
      return;
    }
    if (data.check === "existEmail") {
      setEmailError(data.error);
      return;
    }
    if (data.check === "success") {
      router.push("/signin");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-16 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-16 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          placeholder="you@example.com"
        />
        {emailError && <p className="text-sm text-red-600">{emailError}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Password</label>

        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-16 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="••••••••"
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

        {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Confirm password
        </label>

        <div className="relative">
          <input
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="••••••••"
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

        {confirmPasswordError && (
          <p className="text-sm text-red-600">{confirmPasswordError}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800 transition"
      >
        Sign up
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-slate-900 underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
