import SignInForm from "./SignInForm";

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="mx-auto max-w-md px-6 py-12">
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900">Sign in</h1>
        <div className="rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur">
          <SignInForm />
          <div className="mt-6 text-center text-sm text-slate-600">
            Don’t have an account?{" "}
            <a href="/signup" className="font-medium text-slate-900 underline underline-offset-4">
              Sign Up
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
