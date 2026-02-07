"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Hero,
  Features,
  PersonaSection,
  HowItWorks,
  FinalCTA,
} from "./_components/MarketingSections";

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

export default function LandingPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/home", { cache: "no-store" });
        
        if (res.ok) {
          router.push("/home");
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  function FooterLandingPage() {
  return (
        <footer className="bg-[#111827] text-white py-12">
            <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
              <p>© 2026 FinBuddy. All rights reserved.</p>
            </div>
    </footer>
  )
  }

  return (
    <>
      <LandingNavigation />
      <div className="bg-[#F9FAFB]">
        <Hero />
        <Features />
        <PersonaSection />
        <HowItWorks />
        <FinalCTA />
        <FooterLandingPage/>
      </div>
    </>
  );
}