"use client";

import { useEffect, useState } from "react";
import { Button, Card, DashboardStatCard, SidebarLayout, StatusBadge } from "../../../components/ui";
import {
  getPartnerEarnings,
  readStorage,
  storageKeys,
  type PartnerEarnings,
  type PartnerSession
} from "../../../lib/local-api";

const links = [
  { href: "/partner/dashboard", label: "Overview" },
  { href: "/partner/courses", label: "Courses" },
  { href: "/partner/bookings", label: "Bookings" },
  { href: "/partner/instructors", label: "Instructors" },
  { href: "/partner/vehicles", label: "Vehicles" },
  { href: "/partner/earnings", label: "Earnings" }
];

export default function PartnerEarningsPage() {
  const [session, setSession] = useState<PartnerSession | null>(null);
  const [earnings, setEarnings] = useState<PartnerEarnings | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedSession = readStorage<PartnerSession>(storageKeys.partner);
    setSession(savedSession);
    if (savedSession) void loadEarnings(savedSession);
  }, []);

  async function loadEarnings(activeSession = session) {
    if (!activeSession) return;
    setError("");
    try {
      setEarnings(await getPartnerEarnings(activeSession.token));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load earnings.");
    }
  }

  return (
    <SidebarLayout title="Earnings" role="Partner dashboard" links={links}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-green-700">Live settlements</p>
          <h2 className="mt-1 text-3xl font-black">School earnings after commission</h2>
        </div>
        <Button onClick={() => void loadEarnings()} disabled={!session} variant="ghost">Refresh</Button>
      </div>
      {!session ? <Card className="mb-4"><p className="font-semibold">Partner login required.</p><Button href="/partner/login" className="mt-4">Partner login</Button></Card> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="grid gap-5 md:grid-cols-4">
        <DashboardStatCard label="Booking value" value={`Rs ${earnings?.totals.grossBookingValue ?? 0}`} delta="Mock paid" tone="blue" />
        <DashboardStatCard label="Platform commission" value={`Rs ${earnings?.totals.platformCommission ?? 0}`} delta="DriveConnect" tone="indigo" />
        <DashboardStatCard label="School payout" value={`Rs ${earnings?.totals.schoolPayout ?? 0}`} delta="After commission" tone="green" />
        <DashboardStatCard label="Pending payout" value={`Rs ${earnings?.totals.pendingPayout ?? 0}`} delta="Settlements" tone="amber" />
      </div>
      <Card className="mt-6">
        <h2 className="text-2xl font-black">Settlements</h2>
        <div className="mt-5 grid gap-3">
          {earnings?.settlements.map((settlement) => (
            <div key={settlement.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-4">
              <div>
                <p className="font-black">{settlement.id}</p>
                <p className="text-sm text-slate-500">School payout Rs {settlement.amount} after Rs {settlement.platformCommission} commission</p>
              </div>
              <StatusBadge status={settlement.status} />
            </div>
          ))}
          {session && !earnings?.settlements.length ? <p className="text-sm text-slate-600">New mock-paid customer bookings will create settlements here.</p> : null}
        </div>
      </Card>
    </SidebarLayout>
  );
}
