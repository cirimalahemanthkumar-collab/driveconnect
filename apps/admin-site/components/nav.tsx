"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/schools", label: "Schools" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/payouts", label: "Payouts" }
];

export function AdminNav() {
  const router = useRouter();
  const { user, logout } = useAuth();

  function signOut() {
    logout();
    router.replace("/admin/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-gradient-to-br from-slate-950 via-indigo-700 to-blue-500 text-lg font-black text-white shadow-sm">D</span>
          <span className="text-lg font-black text-slate-950">DriveConnect Admin</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-indigo-700">{link.label}</Link>
          ))}
        </nav>
        {user ? (
          <button onClick={signOut} className="rounded-lg bg-gradient-to-r from-slate-950 to-indigo-700 px-4 py-2 text-sm font-bold text-white shadow-sm">
            Logout
          </button>
        ) : (
          <Link href="/admin/login" className="rounded-lg bg-gradient-to-r from-slate-950 to-indigo-700 px-4 py-2 text-sm font-bold text-white shadow-sm">
            Admin login
          </Link>
        )}
      </div>
    </header>
  );
}
