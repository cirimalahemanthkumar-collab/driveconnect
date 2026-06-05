"use client";

import type { ReactNode } from "react";
import { Button, Card } from "./ui";

export function PageIntro({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase text-blue-600">{eyebrow}</p>
        <h2 className="mt-1 text-3xl font-black text-slate-950">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="grid min-h-[220px] place-items-center px-4 py-10">
      <div className="text-center">
        <div className="mx-auto size-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
      </div>
    </div>
  );
}

export function ErrorBanner({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
      <span>{message}</span>
      {retry ? <Button variant="ghost" className="min-h-9 px-3 py-2" onClick={retry}>Retry</Button> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="mt-5">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </Card>
  );
}

export function TableCard({
  columns,
  children,
  empty
}: {
  columns: string[];
  children: ReactNode;
  empty?: boolean;
}) {
  if (empty) return <EmptyState title="Nothing here yet" body="New records will appear here as your DriveConnect activity grows." />;

  return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-white/80 bg-white/95 shadow-soft ring-1 ring-slate-100/80">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase text-slate-500">
          <tr>{columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Field({
  label,
  children,
  className = ""
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-slate-600 ${className}`}>
      {label}
      {children}
    </label>
  );
}

export function FormError({ message }: { message: string }) {
  return message ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null;
}
