"use client"
import { useState } from "react";
import { redirect } from "next/navigation";

export default function Page() {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); 

    setEmailError(null);
    setPasswordError(null);

    const formData = new FormData(e.currentTarget); 
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
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

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
              />
              {emailError && <p className="text-sm text-red-600">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-white font-semibold shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Sign Up
            </button>

          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <a href="/signin" className="font-medium text-slate-900 underline underline-offset-4">
              Sign in
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
