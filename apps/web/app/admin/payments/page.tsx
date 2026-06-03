"use client";

import { useEffect, useState } from "react";
import { Button, Card, DashboardStatCard, SidebarLayout, StatusBadge } from "../../../components/ui";
import {
  getAdminPayments,
  getAdminSummary,
  readStorage,
  storageKeys,
  type AdminSession,
  type AdminSummary,
  type Payment
} from "../../../lib/local-api";

const links = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/school-verification", label: "School verification" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/complaints", label: "Complaints" }
];

export default function AdminPaymentsPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedSession = readStorage<AdminSession>(storageKeys.admin);
    setSession(savedSession);
    if (savedSession) void loadPayments(savedSession);
  }, []);

  async function loadPayments(activeSession = session) {
    if (!activeSession) return;
    setError("");
    try {
      const [nextSummary, nextPayments] = await Promise.all([
        getAdminSummary(activeSession.token),
        getAdminPayments(activeSession.token)
      ]);
      setSummary(nextSummary);
      setPayments(nextPayments);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load payments.");
    }
  }

  return (
    <SidebarLayout title="Payments" role="Admin dashboard" links={links}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-indigo-700">Platform finance</p>
          <h2 className="mt-1 text-3xl font-black">Payments and settlements</h2>
        </div>
        <Button onClick={() => void loadPayments()} disabled={!session} variant="ghost">Refresh</Button>
      </div>
      {!session ? <Card className="mb-4"><p className="font-semibold">Admin login required.</p><Button href="/admin/login" className="mt-4">Admin login</Button></Card> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="grid gap-5 md:grid-cols-4">
        <DashboardStatCard label="Booking value" value={`Rs ${summary?.grossBookingValue ?? 0}`} delta="Mock paid" tone="blue" />
        <DashboardStatCard label="Commission" value={`Rs ${summary?.platformCommission ?? 0}`} delta="Platform" tone="green" />
        <DashboardStatCard label="Booking fees" value={`Rs ${summary?.bookingFees ?? 0}`} delta="Platform" tone="amber" />
        <DashboardStatCard label="Platform revenue" value={`Rs ${summary?.platformRevenue ?? 0}`} delta="Total" tone="indigo" />
      </div>
      <Card className="mt-6">
        <h2 className="text-2xl font-black">Successful mock payments</h2>
        <div className="mt-5 grid gap-3">
          {payments.map((payment) => (
            <div key={payment.id} className="grid items-center gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-[1fr_120px_160px_140px]">
              <div>
                <p className="font-black">{payment.courseTitle}</p>
                <p className="text-sm text-slate-500">{payment.schoolName} - {payment.customerName}</p>
              </div>
              <p>Rs {payment.amount}</p>
              <p>Commission Rs {payment.platformCommission}</p>
              <StatusBadge status={payment.status} />
            </div>
          ))}
          {session && !payments.length ? <p className="text-sm text-slate-600">Customer checkout payments will appear here.</p> : null}
        </div>
      </Card>
    </SidebarLayout>
  );
}
