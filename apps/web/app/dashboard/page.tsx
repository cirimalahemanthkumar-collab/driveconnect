"use client";

import { useEffect, useState } from "react";
import { Button, Card, DashboardStatCard, Input, StatusBadge } from "../../components/ui";
import { getCustomerBookings, readStorage, storageKeys, writeStorage, type Booking } from "../../lib/local-api";

export default function CustomerDashboardPage() {
  const [mobile, setMobile] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedMobile = readStorage<string>(storageKeys.customerMobile) ?? "";
    setMobile(savedMobile);
    if (savedMobile) void loadBookings(savedMobile);
  }, []);

  async function loadBookings(customerMobile = mobile) {
    if (!customerMobile) return;
    setLoading(true);
    setError("");
    try {
      writeStorage(storageKeys.customerMobile, customerMobile);
      setBookings(await getCustomerBookings(customerMobile));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  const accepted = bookings.filter((booking) => booking.status === "SCHOOL_ACCEPTED").length;
  const waiting = bookings.filter((booking) => booking.status === "WAITING_FOR_SCHOOL_ACCEPTANCE").length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-blue-600">Customer dashboard</p>
          <h1 className="mt-1 text-4xl font-black">Track your live bookings</h1>
        </div>
        <Button href="/checkout" variant="secondary">Book another slot</Button>
      </div>

      <Card className="mt-6 flex flex-wrap items-end gap-3">
        <label className="min-w-[240px] flex-1 text-sm font-semibold text-slate-600">
          Customer mobile
          <Input className="mt-2" value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="+919900001111" />
        </label>
        <Button onClick={() => void loadBookings()} disabled={loading}>{loading ? "Refreshing..." : "Refresh bookings"}</Button>
      </Card>
      {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <section className="mt-6 grid gap-5 md:grid-cols-3">
        <DashboardStatCard label="All bookings" value={String(bookings.length)} delta="Live" tone="blue" />
        <DashboardStatCard label="Awaiting school" value={String(waiting)} delta="Requests" tone="amber" />
        <DashboardStatCard label="Accepted slots" value={String(accepted)} delta="Confirmed" tone="green" />
      </section>

      <section className="mt-8 grid gap-4">
        {bookings.length ? bookings.map((booking) => (
          <Card key={booking.id} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <StatusBadge status={booking.status} />
              <h2 className="mt-3 text-xl font-black">{booking.courseTitle}</h2>
              <p className="text-sm text-slate-500">{booking.schoolName} - {booking.preferredStartDate}, {booking.preferredTimeSlot}</p>
            </div>
            <div className="text-right">
              <p className="font-black">Rs {booking.totalAmount}</p>
              <p className="mt-1 text-sm text-slate-500">Booking #{booking.id.slice(-6)}</p>
            </div>
          </Card>
        )) : (
          <Card>
            <h2 className="text-xl font-black">No bookings yet</h2>
            <p className="mt-2 text-sm text-slate-600">Use checkout to send your first slot request to a verified school.</p>
          </Card>
        )}
      </section>
    </main>
  );
}
