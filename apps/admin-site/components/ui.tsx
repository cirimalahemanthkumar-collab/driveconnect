import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "dark" | "danger";
};

const buttonStyles = {
  primary: "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600",
  secondary: "bg-gradient-to-r from-amber-300 to-orange-300 text-slate-950 hover:from-amber-400 hover:to-orange-400",
  ghost: "bg-white/80 text-slate-800 ring-1 ring-slate-200 hover:bg-white",
  dark: "bg-slate-950 text-white hover:bg-slate-800",
  danger: "bg-gradient-to-r from-rose-600 to-red-500 text-white hover:from-rose-700 hover:to-red-600"
};

export function Button({ children, href, variant = "primary", className = "", ...props }: ButtonProps) {
  const classes = `focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]} ${className}`;

  if (href) return <Link href={href} className={classes}>{children}</Link>;
  return <button {...props} className={classes}>{children}</button>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/80 bg-white/95 p-5 shadow-soft ring-1 ring-slate-100/80 ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "slate" | "red" | "indigo" }) {
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

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`focus-ring min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm shadow-sm ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`focus-ring min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm shadow-sm ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`focus-ring w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm ${props.className ?? ""}`} />;
}

export function StatusBadge({ status }: { status: unknown }) {
  const text = String(status ?? "UNKNOWN").toUpperCase();
  const tone = text.includes("APPROVED") || text.includes("VERIFIED") || text.includes("PAID") || text.includes("RESOLVED")
    ? "green"
    : text.includes("PENDING") || text.includes("OPEN") || text.includes("REVIEW")
      ? "amber"
      : text.includes("REJECT") || text.includes("SUSPEND") || text.includes("FAILED")
        ? "red"
        : "blue";
  return <Badge tone={tone}>{formatLabel(text)}</Badge>;
}

export function StatCard({ label, value, detail, tone = "blue" }: { label: string; value: string; detail: string; tone?: "blue" | "green" | "amber" | "indigo" }) {
  const bars = {
    blue: "from-blue-500 to-cyan-400",
    green: "from-green-500 to-emerald-300",
    amber: "from-amber-400 to-orange-400",
    indigo: "from-indigo-500 to-blue-500"
  };
  return (
    <Card className="overflow-hidden p-0">
      <div className={`h-2 bg-gradient-to-r ${bars[tone]}`} />
      <div className="p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        <p className="mt-2 text-xs font-semibold text-slate-500">{detail}</p>
      </div>
    </Card>
  );
}

export function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" | "info" }) {
  const styles = {
    error: "bg-red-50 text-red-700 ring-red-100",
    success: "bg-green-50 text-green-700 ring-green-100",
    info: "bg-blue-50 text-blue-700 ring-blue-100"
  };
  return <p className={`rounded-lg p-3 text-sm font-semibold ring-1 ${styles[tone]}`}>{children}</p>;
}

export function LoadingPanel({ label = "Loading..." }: { label?: string }) {
  return (
    <Card className="grid min-h-36 place-items-center">
      <div className="text-center">
        <span className="mx-auto block size-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="mt-3 text-sm font-semibold text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-slate-50 p-5 text-sm font-semibold text-slate-500">{children}</div>;
}

export function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

