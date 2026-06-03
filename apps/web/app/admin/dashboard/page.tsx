"use client";

import { useEffect, useState } from "react";
import { Button, Card, DashboardStatCard, SidebarLayout, StatusBadge } from "../../../components/ui";
import {
  getAdminBookings,
  getAdminSummary,
  listSchools,
  readStorage,
  storageKeys,
  type AdminSession,
  type AdminSummary,
  type Booking,
  type School
} from "../../../lib/local-api";

const links = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/school-verification", label: "School verification" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/complaints", label: "Complaints" }
];

export default function AdminDashboardPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const savedSession = readStorage<AdminSession>(storageKeys.admin);
    setSession(savedSession);
    if (savedSession) {
      void Promise.all([getAdminSummary(savedSession.token), listSchools(), getAdminBookings(savedSession.token)])
        .then(([nextSummary, nextSchools, nextBookings]) => {
          setSummary(nextSummary);
          setSchools(nextSchools);
          setBookings(nextBookings);
        });
    }
  }, []);

  return (
    <SidebarLayout title="Platform" role="Admin dashboard" links={links}>
      {!session ? (
        <Card className="mb-5"><h2 className="text-xl font-black">Set up or log in to the admin account</h2><p className="mt-2 text-sm text-slate-600">The first admin account becomes the DriveConnect platform owner.</p><Button href="/admin/login" className="mt-4">Admin access</Button></Card>
      ) : null}
      <div className="grid gap-5 md:grid-cols-4">
        <DashboardStatCard label="Schools" value={String(summary?.schools ?? 0)} delta={`${summary?.verifiedSchools ?? 0} verified`} tone="blue" />
        <DashboardStatCard label="Review queue" value={String(summary?.pendingSchools ?? 0)} delta="Partners" tone="amber" />
        <DashboardStatCard label="Bookings" value={String(summary?.bookings ?? 0)} delta={`${summary?.acceptedBookings ?? 0} accepted`} tone="green" />
        <DashboardStatCard label="Booking value" value={`Rs ${summary?.grossBookingValue ?? 0}`} delta="Recorded" tone="indigo" />
      </div>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black">Verification queue</h2><Button href="/admin/school-verification" variant="ghost">Review</Button></div>
          <div className="mt-5 grid gap-3">
            {schools.slice(0, 4).map((school) => (
              <div key={school.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-4">
                <div><p className="font-black">{school.name}</p><p className="text-sm text-slate-500">{school.city}</p></div>
                <StatusBadge status={school.verificationStatus} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black">Recent bookings</h2><Button href="/admin/bookings" variant="dark">View all</Button></div>
          <div className="mt-5 grid gap-3">
            {bookings.slice(0, 4).map((booking) => (
              <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-4">
                <div><p className="font-black">{booking.courseTitle}</p><p className="text-sm text-slate-500">{booking.schoolName}</p></div>
                <StatusBadge status={booking.status} />
              </div>
            ))}
            {!bookings.length ? <p className="text-sm text-slate-600">No customer bookings yet.</p> : null}
          </div>
        </Card>
      </section>
    </SidebarLayout>
  );
}
