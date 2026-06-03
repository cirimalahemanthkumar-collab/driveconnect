import Link from "next/link";
type BookingStatus = string;
type SchoolVerificationStatus = string;

function toReadableStatus(status: string | null | undefined) {
  return String(status || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const trustBadges: any[] = [];
type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "dark";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const buttonStyles = {
  primary: "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600",
  secondary: "bg-gradient-to-r from-amber-300 to-orange-300 text-slate-950 hover:from-amber-400 hover:to-orange-400",
  ghost: "bg-white/80 text-slate-800 ring-1 ring-slate-200 hover:bg-white",
  dark: "bg-slate-950 text-white hover:bg-slate-800"
};

export function Button({ children, href, variant = "primary", className = "", type = "button", onClick, disabled = false }: ButtonProps) {
  const classes = `focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-white/80 bg-white/95 p-5 shadow-soft ring-1 ring-slate-100/80 ${className}`}>{children}</div>;
}

export function Badge({
  children,
  tone = "blue"
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "slate" | "red" | "indigo";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-green-50 text-green-700 ring-green-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    red: "bg-red-50 text-red-700 ring-red-100",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100"
  };

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>{children}</span>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`focus-ring min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm shadow-sm ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`focus-ring min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm shadow-sm ${props.className ?? ""}`}
    />
  );
}

export function Modal({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: BookingStatus | SchoolVerificationStatus | string }) {
  const statusText = String(status);
  const tone =
    statusText.includes("VERIFIED") || statusText.includes("SUCCESS") || statusText.includes("COMPLETED")
      ? "green"
      : statusText.includes("PENDING") || statusText.includes("WAITING") || statusText.includes("REVIEW")
        ? "amber"
        : statusText.includes("REJECTED") || statusText.includes("CANCELLED")
          ? "red"
          : "blue";

  return <Badge tone={tone}>{toReadableStatus(statusText)}</Badge>;
}

export function DashboardStatCard({
  label,
  value,
  delta,
  tone = "blue"
}: {
  label: string;
  value: string;
  delta: string;
  tone?: "blue" | "green" | "amber" | "indigo";
}) {
  const bar = {
    blue: "from-blue-500 to-cyan-400",
    green: "from-green-500 to-emerald-300",
    amber: "from-amber-400 to-orange-400",
    indigo: "from-indigo-500 to-blue-500"
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className={`h-2 bg-gradient-to-r ${bar[tone]}`} />
      <div className="p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="text-3xl font-black text-slate-950">{value}</p>
          <Badge tone={tone === "amber" ? "amber" : tone === "green" ? "green" : "blue"}>{delta}</Badge>
        </div>
      </div>
    </Card>
  );
}

export function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800 ring-1 ring-amber-100">
      {rating.toFixed(1)} / 5
    </span>
  );
}

export function SchoolCard({ school }: { school: (typeof import("../lib/mock").schools)[number] }) {
  return (
    <Card className="group overflow-hidden p-0">
      <div className={`h-24 bg-gradient-to-r ${school.gradient}`} />
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-950">{school.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{school.city} - {school.distance} km away</p>
          </div>
          <StatusBadge status={school.status} />
        </div>
        <p className="text-sm leading-6 text-slate-600">{school.description}</p>
        <div className="flex flex-wrap gap-2">
          <RatingStars rating={school.rating} />
          <Badge tone={school.pickup ? "green" : "slate"}>{school.pickup ? "Pickup" : "No pickup"}</Badge>
          {school.femaleInstructor ? <Badge tone="indigo">Female instructor</Badge> : null}
          {school.featured ? <Badge tone="amber">Featured</Badge> : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">Starts from <span className="text-lg font-black text-slate-950">Rs {school.priceFrom}</span></p>
          <Button href={`/schools/${school.id}`} variant="dark">View school</Button>
        </div>
      </div>
    </Card>
  );
}

export function CourseCard({ course }: { course: (typeof import("../lib/mock").courses)[number] }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-blue-600">{course.type}</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{course.title}</h3>
        </div>
        <Badge tone={course.pickup ? "green" : "slate"}>{course.pickup ? "Pickup included" : "Self visit"}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <MiniStat label="Vehicle" value={course.vehicle} />
        <MiniStat label="Sessions" value={String(course.sessions)} />
        <MiniStat label="Days" value={String(course.days)} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-500">Advance <span className="font-bold text-slate-950">Rs {course.advance}</span></p>
        <Button href={`/courses/${course.id}`} variant="secondary">Book Rs {course.price}</Button>
      </div>
    </Card>
  );
}

export function BookingTimeline({ steps }: { steps: BookingStatus[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="grid size-8 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</div>
            {index !== steps.length - 1 ? <div className="h-8 w-px bg-blue-100" /> : null}
          </div>
          <div>
            <StatusBadge status={step} />
            <p className="mt-1 text-sm text-slate-500">Updated by DriveConnect workflow</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SidebarLayout({
  title,
  role,
  links,
  children
}: {
  title: string;
  role: string;
  links: Array<{ href: string; label: string }>;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[240px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <p className="text-xs font-bold uppercase text-blue-600">{role}</p>
        <h1 className="mt-1 text-2xl font-black">{title}</h1>
        <nav className="mt-6 grid gap-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700">
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section>{children}</section>
    </main>
  );
}

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-gradient-to-br from-blue-600 via-cyan-500 to-green-400 text-lg font-black text-white shadow-sm">D</span>
          <span className="text-lg font-black text-slate-950">DriveConnect</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/schools">Schools</Link>
          <Link href="/partner/dashboard">Partner</Link>
          <Link href="/admin/dashboard">Admin</Link>
        </nav>
        <Button href="/login" variant="secondary" className="min-h-10 px-4 py-2">Login</Button>
      </div>
    </header>
  );
}

export function TrustBadges() {
  return (
    <div className="flex flex-wrap gap-2">
      {trustBadges.map((badge, index) => (
        <Badge key={badge} tone={index % 3 === 0 ? "blue" : index % 3 === 1 ? "green" : "amber"}>
          {badge}
        </Badge>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
