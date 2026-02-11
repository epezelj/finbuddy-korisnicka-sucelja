import Link from "next/link";
import SignUpForm from "./signupForm";

export default function Page() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <section className="mx-auto w-full max-w-md px-4 sm:px-6 py-10 sm:py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
          >
            <span aria-hidden>←</span>
            Main page
          </Link>
        </div>

        <h1 className="mb-6 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Sign up
        </h1>

        <div className="rounded-2xl border bg-white/70 p-5 sm:p-6 shadow-sm backdrop-blur">
          <SignUpForm />
        </div>
      </section>
    </main>
  );
}
