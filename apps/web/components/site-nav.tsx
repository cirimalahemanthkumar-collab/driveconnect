"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
};

const customerLinks: NavLink[] = [
  { href: "/schools", label: "Find schools" },
  { href: "/home", label: "Customer home" },
  { href: "/dashboard", label: "My bookings" },
  { href: "/support", label: "Support" }
];

const partnerLinks: NavLink[] = [
  { href: "/partner", label: "Partner site" },
  { href: "/partner/login", label: "Login" },
  { href: "/partner/register", label: "Register school" },
  { href: "/partner/dashboard", label: "Dashboard" },
  { href: "/partner/bookings", label: "Bookings" },
  { href: "/partner/earnings", label: "Earnings" }
];

const adminLinks: NavLink[] = [
  { href: "/admin", label: "Admin site" },
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/school-verification", label: "Verification" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/complaints", label: "Complaints" }
];

export function SiteNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return (
      <NavShell
        brand="DriveConnect Admin"
        homeHref="/admin"
        links={adminLinks}
        ctaHref="/admin/login"
        ctaLabel="Admin login"
        tone="admin"
      />
    );
  }

  if (pathname.startsWith("/partner")) {
    return (
      <NavShell
        brand="DriveConnect Partner"
        homeHref="/partner"
        links={partnerLinks}
        ctaHref="/partner/register"
        ctaLabel="Register"
        tone="partner"
      />
    );
  }

  return (
    <NavShell
      brand="DriveConnect"
      homeHref="/"
      links={customerLinks}
      ctaHref="/login"
      ctaLabel="Customer login"
      tone="customer"
    />
  );
}

function NavShell({
  brand,
  homeHref,
  links,
  ctaHref,
  ctaLabel,
  tone
}: {
  brand: string;
  homeHref: string;
  links: NavLink[];
  ctaHref: string;
  ctaLabel: string;
  tone: "customer" | "partner" | "admin";
}) {
  const badgeStyles = {
    customer: "from-blue-600 via-cyan-500 to-green-400",
    partner: "from-green-600 via-emerald-400 to-amber-300",
    admin: "from-slate-950 via-indigo-700 to-blue-500"
  };
  const ctaStyles = {
    customer: "from-amber-300 to-orange-300 text-slate-950 hover:from-amber-400 hover:to-orange-400",
    partner: "from-green-500 to-emerald-300 text-white hover:from-green-600 hover:to-emerald-400",
    admin: "from-slate-950 to-indigo-700 text-white hover:from-slate-800 hover:to-indigo-800"
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href={homeHref} className="flex items-center gap-3">
          <span className={`grid size-10 place-items-center rounded-lg bg-gradient-to-br ${badgeStyles[tone]} text-lg font-black text-white shadow-sm`}>
            D
          </span>
          <span className="text-lg font-black text-slate-950">{brand}</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blue-700">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href={ctaHref}
          className={`focus-ring inline-flex min-h-10 items-center justify-center rounded-lg bg-gradient-to-r px-4 py-2 text-sm font-bold shadow-sm transition ${ctaStyles[tone]}`}
        >
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
