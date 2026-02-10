import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import Image from "next/image";
import Link from "next/link";
import {
  Hero,
  Features,
  PersonaSection,
  HowItWorks,
  FinalCTA,
} from "./_components/MarketingSections";

const key = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev_secret_change_me"
);

async function isLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, key, { algorithms: ["HS256"],
  clockTolerance: 15, });
    return true;
  } catch {
    return false;
  }
}

function LandingNavigation() {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/finbuddylogo.png"
              alt="FinBuddy Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
            <span className="font-extrabold tracking-tight text-xl">
              FinBuddy
            </span>
          </Link>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-6">
              <li>
                <a
                  href="#features"
                  className="text-white/90 hover:text-white font-semibold transition"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-white/90 hover:text-white font-semibold transition"
                >
                  How It Works
                </a>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-white/90 hover:text-white font-semibold transition hidden md:block"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function FooterLandingPage() {
  return (
    <footer className="bg-[#111827] text-white py-12">
      <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
        <p>© 2026 FinBuddy. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default async function LandingPage() {
  const loggedIn = await isLoggedIn();
  if (loggedIn) redirect("/home");

  return (
    <>
      <LandingNavigation />
      <div className="bg-[#F9FAFB]">
        <Hero />
        <Features />
        <PersonaSection />
        <HowItWorks />
        <FinalCTA />
        <FooterLandingPage />
      </div>
    </>
  );
}