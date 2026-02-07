"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

type Page = { title: string; path: `/${string}` };

const pages: Page[] = [
  { title: "Home", path: "/home" },
  { title: "Transactions", path: "/transactions" },
  { title: "Accounts", path: "/accounts" },
  { title: "Reports", path: "/reports" },
  { title: "Categories", path: "/categories" },
  { title: "Blog", path: "/blog" },
  { title: "Settings", path: "/settings" },
  { title: "Sign Out", path: "/signout" },
];

export function Navigation() {
  const currentPath = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-blue-600 text-white shadow-lg">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link
            href="/home"
            className="flex items-center gap-3 flex-shrink-0"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/finbuddylogo.png"
              alt="FinBuddy Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
            <span className="font-extrabold tracking-tight text-xl">FinBuddy</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-6">
              {pages
                .filter((p) => p.path !== "/signout")
                .map((page) => {
                  const active = currentPath === page.path;
                  return (
                    <li key={page.path}>
                      <Link
                        href={page.path}
                        className={[
                          "font-semibold transition",
                          active ? "text-white" : "text-white/90 hover:text-white",
                        ].join(" ")}
                      >
                        <span className="relative">
                          {page.title}
                          {active ? (
                            <span className="absolute left-0 -bottom-2 h-0.5 w-full bg-white rounded" />
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Sign Out as button (desktop) */}
            <Link
              href="/signout"
              className="hidden lg:inline-flex bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              Sign Out
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              aria-expanded={open}
              aria-label="Toggle menu"
            >
              Menu
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open ? (
          <div className="lg:hidden pb-4">
            <div className="rounded-xl bg-white/10 p-3">
              <ul className="flex flex-col gap-1">
                {pages.map((page) => {
                  const active = currentPath === page.path;
                  const isSignOut = page.path === "/signout";

                  return (
                    <li key={page.path}>
                      <Link
                        href={page.path}
                        onClick={() => setOpen(false)}
                        className={[
                          "block rounded-lg px-3 py-2 font-semibold transition",
                          isSignOut
                            ? "bg-white text-blue-600 hover:bg-gray-100"
                            : active
                              ? "bg-white/15 text-white"
                              : "text-white/90 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                      >
                        {page.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
