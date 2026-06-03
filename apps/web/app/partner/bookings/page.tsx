"use client";

import { useEffect, useState } from "react";
import { Button, Card, SidebarLayout, StatusBadge } from "../../../components/ui";
import {
  getPartnerBookings,
  readStorage,
  storageKeys,
  updateBookingStatus,
  type Booking,
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

export default function PartnerBookingsPage() {
  const [session, setSession] = useState<PartnerSession | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedSession = readStorage<PartnerSession>(storageKeys.partner);
    setSession(savedSession);
    if (savedSession) void loadBookings(savedSession);
  }, []);

  async function loadBookings(activeSession = session) {
    if (!activeSession) return;
    setLoading(true);
    setError("");
    try {
      setBookings(await getPartnerBookings(activeSession.token));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(bookingId: string, status: "SCHOOL_ACCEPTED" | "SCHOOL_REJECTED") {
    if (!session) return;
    setError("");
    try {
      await updateBookingStatus(session.token, bookingId, status);
      await loadBookings(session);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update booking.");
    }
  }

  return (
    <SidebarLayout title={session?.school.name ?? "Bookings"} role="Partner dashboard" links={links}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-green-700">Live booking requests</p>
          <h2 className="mt-1 text-3xl font-black">Accept or reject customer slots</h2>
        </div>
        <Button onClick={() => void loadBookings()} disabled={!session || loading} variant="secondary">{loading ? "Refreshing..." : "Refresh queue"}</Button>
      </div>
      {!session ? (
        <Card>
          <h2 className="text-xl font-black">Partner login required</h2>
          <p className="mt-2 text-sm text-slate-600">Log in with the school owner mobile number and PIN to view the private booking queue.</p>
          <Button href="/partner/login" className="mt-4">Partner login</Button>
        </Card>
      ) : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="grid gap-4">
        {session && !bookings.length ? (
          <Card><h2 className="text-xl font-black">No slot requests yet</h2><p className="mt-2 text-sm text-slate-600">New customer bookings for this school appear here.</p></Card>
        ) : null}
        {bookings.map((booking) => (
          <Card key={booking.id} className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <StatusBadge status={booking.status} />
              <h2 className="mt-3 text-xl font-black">{booking.courseTitle}</h2>
              <p className="text-sm text-slate-500">{booking.customerName} - {booking.customerMobile}</p>
              <p className="mt-1 text-sm text-slate-500">{booking.preferredStartDate}, {booking.preferredTimeSlot} - Rs {booking.totalAmount}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void changeStatus(booking.id, "SCHOOL_ACCEPTED")} variant="secondary">Accept slot</Button>
              <Button onClick={() => void changeStatus(booking.id, "SCHOOL_REJECTED")} variant="ghost">Reject</Button>
            </div>
          </Card>
        ))}
      </div>
    </SidebarLayout>
  );
}
