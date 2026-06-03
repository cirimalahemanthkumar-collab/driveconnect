"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "./auth-provider";

type LinkItem = { href: string; label: string };

export const customerLinks: LinkItem[] = [
  { href: "/customer/dashboard", label: "Dashboard" },
  { href: "/customer/marketplace", label: "Marketplace" },
  { href: "/customer/bookings", label: "My bookings" },
  { href: "/customer/payments", label: "Payments" },
  { href: "/customer/sessions", label: "Sessions" },
  { href: "/customer/reviews", label: "Reviews" },
  { href: "/customer/complaints", label: "Complaints" },
  { href: "/customer/notifications", label: "Notifications" }
];

export const partnerLinks: LinkItem[] = [
  { href: "/partner/dashboard", label: "Dashboard" },
  { href: "/partner/school", label: "School profile" },
  { href: "/partner/courses", label: "Courses" },
  { href: "/partner/bookings", label: "Bookings" },
  { href: "/partner/instructors", label: "Instructors" },
  { href: "/partner/vehicles", label: "Vehicles" },
  { href: "/partner/sessions", label: "Sessions" },
  { href: "/partner/payouts", label: "Payouts" },
  { href: "/partner/documents", label: "Documents" }
];

export function AppShell({
  role,
  title,
  links,
  children
}: {
  role: "Customer" | "School owner";
  title: string;
  links: LinkItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const accent = role === "Customer"
    ? "from-blue-600 via-cyan-500 to-green-400"
    : "from-emerald-600 via-teal-500 to-amber-300";

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[248px_1fr]">
      <aside className="h-fit overflow-hidden rounded-lg border border-white/80 bg-white/95 shadow-soft ring-1 ring-slate-100/80 lg:sticky lg:top-24">
        <div className={`bg-gradient-to-r ${accent} p-5 text-white`}>
          <p className="text-xs font-bold uppercase text-white/80">{role} portal</p>
          <h1 className="mt-1 text-2xl font-black">{title}</h1>
          <p className="mt-2 text-sm text-white/90">{user?.name ?? user?.email ?? "DriveConnect member"}</p>
        </div>
        <nav className="grid gap-1 p-3">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            onClick={() => logout()}
          >
            Logout
          </button>
        </nav>
      </aside>
      <section className="min-w-0">{children}</section>
    </main>
  );
}
