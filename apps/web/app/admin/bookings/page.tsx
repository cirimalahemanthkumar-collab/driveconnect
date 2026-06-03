"use client";

import { useEffect, useState } from "react";
import { Button, Card, SidebarLayout, StatusBadge } from "../../../components/ui";
import { getAdminBookings, readStorage, storageKeys, type AdminSession, type Booking } from "../../../lib/local-api";

const links = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/school-verification", label: "School verification" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/complaints", label: "Complaints" }
];

export default function AdminBookingsPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedSession = readStorage<AdminSession>(storageKeys.admin);
    setSession(savedSession);
    if (savedSession) void loadBookings(savedSession);
  }, []);

  async function loadBookings(activeSession = session) {
    if (!activeSession) return;
    setError("");
    try {
      setBookings(await getAdminBookings(activeSession.token));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load bookings.");
    }
  }

  return (
    <SidebarLayout title="Bookings" role="Admin dashboard" links={links}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-bold uppercase text-indigo-700">Platform oversight</p><h2 className="mt-1 text-3xl font-black">All customer slot requests</h2></div>
        <Button onClick={() => void loadBookings()} disabled={!session} variant="ghost">Refresh</Button>
      </div>
      {!session ? <Card className="mb-4"><p className="font-semibold">Admin login required.</p><Button href="/admin/login" className="mt-4">Admin login</Button></Card> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="grid gap-4">
        {session && !bookings.length ? <Card><p className="font-semibold">No customer bookings yet.</p></Card> : null}
        {bookings.map((booking) => (
          <Card key={booking.id} className="grid gap-4 md:grid-cols-[1fr_140px_190px]">
            <div>
              <h2 className="text-xl font-black">{booking.courseTitle}</h2>
              <p className="text-sm text-slate-500">{booking.schoolName} - {booking.customerName}</p>
              <p className="mt-1 text-sm text-slate-500">{booking.preferredStartDate}, {booking.preferredTimeSlot}</p>
            </div>
            <p className="font-black">Rs {booking.totalAmount}</p>
            <StatusBadge status={booking.status} />
          </Card>
        ))}
      </div>
    </SidebarLayout>
  );
}
