"use client";

import Link from "next/link";
import { destinationFor, useAuth } from "./auth-provider";

const publicLinks = [
  { href: "/schools", label: "Find schools" },
  { href: "/register", label: "Join DriveConnect" }
];

export function CustomerNav() {
  const { loading, logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-gradient-to-br from-blue-600 via-cyan-500 to-green-400 text-lg font-black text-white shadow-sm">D</span>
          <span className="text-lg font-black text-slate-950">DriveConnect</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 md:flex">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blue-700">{link.label}</Link>
          ))}
          {user ? <Link href={destinationFor(user.role)} className="hover:text-blue-700">Dashboard</Link> : null}
        </nav>
        {loading ? (
          <span className="text-sm font-semibold text-slate-500">Loading...</span>
        ) : user ? (
          <button
            type="button"
            className="rounded-lg bg-gradient-to-r from-amber-300 to-orange-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm"
            onClick={() => logout()}
          >
            Logout
          </button>
        ) : (
          <Link href="/login" className="rounded-lg bg-gradient-to-r from-amber-300 to-orange-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
