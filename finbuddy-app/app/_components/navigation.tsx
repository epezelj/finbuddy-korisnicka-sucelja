"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Page = {
  title: string;
  path: `/${string}`;
};

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

  return (
    <header className="sticky top-0 z-50 bg-blue-600 text-white shadow-lg">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between gap-6">
          <Link href="/home" className="font-extrabold tracking-tight text-xl">
            FinBuddy
          </Link>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-8">
              {pages.map((page) => {
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

          <nav className="md:hidden">
            <Link
              href="/home"
              className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/20"
            >
              Menu
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
