"use client";

import { useEffect, useState } from "react";
import { Button, Card, DashboardStatCard, SidebarLayout, StatusBadge } from "../../../components/ui";
import { getPartnerBookings, readStorage, storageKeys, type Booking, type PartnerSession } from "../../../lib/local-api";

const links = [
  { href: "/partner/dashboard", label: "Overview" },
  { href: "/partner/courses", label: "Courses" },
  { href: "/partner/bookings", label: "Bookings" },
  { href: "/partner/instructors", label: "Instructors" },
  { href: "/partner/vehicles", label: "Vehicles" },
  { href: "/partner/earnings", label: "Earnings" }
];

export default function PartnerDashboardPage() {
  const [session, setSession] = useState<PartnerSession | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const savedSession = readStorage<PartnerSession>(storageKeys.partner);
    setSession(savedSession);
    if (savedSession) void getPartnerBookings(savedSession.token).then(setBookings);
  }, []);

  const waiting = bookings.filter((booking) => booking.status === "WAITING_FOR_SCHOOL_ACCEPTANCE").length;
  const accepted = bookings.filter((booking) => booking.status === "SCHOOL_ACCEPTED").length;

  return (
    <SidebarLayout title={session?.school.name ?? "Partner"} role="Partner dashboard" links={links}>
      {!session ? (
        <Card className="mb-5"><h2 className="text-xl font-black">Log in to operate your school</h2><Button href="/partner/login" className="mt-4">Partner login</Button></Card>
      ) : (
        <Card className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-bold uppercase text-green-700">School account</p><h2 className="mt-1 text-xl font-black">{session.school.name}</h2></div>
          <StatusBadge status={session.school.verificationStatus} />
        </Card>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        <DashboardStatCard label="Booking requests" value={String(bookings.length)} delta="Live" tone="blue" />
        <DashboardStatCard label="Awaiting action" value={String(waiting)} delta="Queue" tone="amber" />
        <DashboardStatCard label="Accepted slots" value={String(accepted)} delta="Confirmed" tone="green" />
      </div>
      <Card className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Latest requests</h2>
          <Button href="/partner/bookings" variant="dark">Manage queue</Button>
        </div>
        <div className="mt-5 grid gap-3">
          {bookings.length ? bookings.slice(0, 4).map((booking) => (
            <div key={booking.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
              <div><h3 className="font-black">{booking.courseTitle}</h3><p className="text-sm text-slate-500">{booking.customerName} - {booking.preferredTimeSlot}</p></div>
              <StatusBadge status={booking.status} />
            </div>
          )) : <p className="text-sm text-slate-600">No customer requests yet.</p>}
        </div>
      </Card>
    </SidebarLayout>
  );
}
