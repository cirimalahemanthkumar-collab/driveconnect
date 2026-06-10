"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { Badge, Button, LoadingPanel } from "./ui";
import { NotificationBell } from "./notification-bell";

const adminLinks = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/schools", label: "Schools" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/notifications", label: "Notifications" }
];

export function AdminShell({ title, eyebrow, children, actions }: { title: string; eyebrow: string; children: ReactNode; actions?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
  }, [loading, router, user]);

  if (loading || !user) {
    return <main className="mx-auto max-w-3xl px-4 py-14"><LoadingPanel label="Checking admin access..." /></main>;
  }

  function signOut() {
    logout();
    router.replace("/admin/login");
  }

  return (
    <main className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[250px_1fr]">
      <aside className="h-fit rounded-xl border border-white/80 bg-white/90 p-4 shadow-soft ring-1 ring-slate-100 lg:sticky lg:top-20">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Admin workspace</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">DriveConnect</h2>
        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:grid">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${pathname === link.href ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-5 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 p-3">
          <Badge tone="indigo">{user.role.replace(/_/g, " ")}</Badge>
          <p className="mt-2 truncate text-sm font-black text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email ?? user.mobile ?? "Authenticated admin"}</p>
          <Button onClick={signOut} variant="ghost" className="mt-3 w-full">Logout</Button>
        </div>
      </aside>
      <section className="min-w-0">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-indigo-700">{eyebrow}</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NotificationBell />
            {actions}
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
