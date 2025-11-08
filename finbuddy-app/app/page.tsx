import { redirect } from "next/navigation";
import { Navigation } from "@components/navigation";
import { login, signup } from "../lib/auth-node";


export default async function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navigation />

      <section className="mx-auto max-w-md px-6 py-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-6">
          Create account
        </h1>

        <div className="rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur">
          <form
            action={async (formData) => {
              "use server";
              // 1) Create user in DB
              await signup(formData);

              // 2) Auto sign-in with same credentials
              const loginData = new FormData();
              loginData.set("email", String(formData.get("email") || ""));
              loginData.set("password", String(formData.get("password") || ""));
              await login(loginData);

              // 3) Go somewhere nice
              redirect("/home");
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Name (optional)
              </label>
              <input
                id="name"
                name="name"
                type="text"
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
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-white font-semibold shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Sign up
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-slate-900 underline underline-offset-4">
              Sign in
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
