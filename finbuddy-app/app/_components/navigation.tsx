"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


type Page = {
  title: string;
  path: `/${string}`;
};


const pages: Page[] = [

  {
    title: "Home",
    path: "/home",
  },
  
  {
    title: "Transactions",
    path: "/transactions",
  },

  {
    title: "Accounts",
    path: "/accounts",
  },

  {
    title: "Reports",
    path: "/reports",
  },
 
  {
    title: "Categories",
    path: "/categories",
  },

  {
    title: "Blog",
    path: "/blog",
  },

  {
    title: "Settings",
    path: "/settings",
  },
  {
    title: "Sign Out",
    path: "/signout",
  },

];


function processPage(page: Page, index: number, currentPath?: string) {
  return (
    <li key={index}>
      <Link
        href={page.path}
        className={currentPath === page.path ? "font-extrabold" : "hover:font-extrabold transition-colors duration-150"}
      >
        {page.title}
      </Link>
    </li>
  );
}

export function Navigation() {

  const currentPath = usePathname();
  return (
    <nav>
      <ul className="flex space-x-10 mb-5">
        {pages.map((page, index) => processPage(page, index, currentPath))}
      </ul>
    </nav>
  );
}
