import Link from "next/link";
import SignInForm from "./signinForm";

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="mx-auto max-w-md px-6 py-12">
        <div className="mb-6 ml-[-10rem]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
            <span aria-hidden>←</span>
            Main page
          </Link>
        </div>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900">Sign in</h1>
        <div className="rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur">
          <SignInForm />
          <div className="mt-6 text-center text-sm text-slate-600">
            Don’t have an account?{" "}
            <a href="/signup" className="font-medium text-slate-900 underline underline-offset-4">
              Sign up
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
