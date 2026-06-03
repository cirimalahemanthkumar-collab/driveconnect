"use client";

import { Button, Card, DashboardStatCard, StatusBadge } from "../../../../web/components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, asRecord, money, numberValue, text } from "../../../lib/records";
import { ErrorBanner, LoadingState, PageIntro } from "../../../components/portal-ui";

export default function PartnerDashboardPage() {
  const summaryResource = useApiResource<unknown>(API_ENDPOINTS.partner.dashboard, {});
  const bookingsResource = useApiResource<unknown>(API_ENDPOINTS.partner.bookings, []);
  const summary = asRecord(summaryResource.data);
  const bookings = asList(bookingsResource.data, ["bookings", "items"]);
  const loading = summaryResource.loading || bookingsResource.loading;

  if (loading) return <LoadingState label="Preparing partner operations..." />;

  return (
    <div>
      <PageIntro eyebrow="Partner dashboard" title="Run your school from one focused workspace" description="Manage new requests, class activity, courses, and payouts without losing the thread." action={<Button href="/partner/bookings" variant="secondary">Open bookings</Button>} />
      {summaryResource.error || bookingsResource.error ? <ErrorBanner message={summaryResource.error || bookingsResource.error} /> : null}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="New bookings" value={String(numberValue(summary, "newBookings", "pendingBookings", "bookings"))} delta="Requests" tone="blue" />
        <DashboardStatCard label="Active courses" value={String(numberValue(summary, "activeCourses", "courses"))} delta="Catalogue" tone="green" />
        <DashboardStatCard label="Upcoming classes" value={String(numberValue(summary, "upcomingSessions", "sessions"))} delta="Schedule" tone="amber" />
        <DashboardStatCard label="Pending payout" value={money(summary.pendingPayout ?? summary.payoutAmount)} delta="Finance" tone="indigo" />
      </section>
      <section className="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-sm font-bold uppercase text-green-700">Booking queue</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">Latest customer requests</h3>
          <div className="mt-4 grid gap-4">
            {bookings.slice(0, 4).map((booking, index) => (
              <Card key={text(booking, "id", "_id") + index} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <StatusBadge status={text(booking, "status")} />
                  <h4 className="mt-3 text-lg font-black text-slate-950">{text(booking, "customerName", "customer")}</h4>
                  <p className="mt-1 text-sm text-slate-500">{text(booking, "courseTitle", "courseName")}</p>
                </div>
                <Button href="/partner/bookings" variant="ghost">Review</Button>
              </Card>
            ))}
            {!bookings.length ? <Card><p className="text-sm text-slate-600">New customer slot requests will appear here.</p></Card> : null}
          </div>
        </div>
        <Card>
          <p className="text-sm font-bold uppercase text-amber-700">Quick actions</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">Keep operations current</h3>
          <div className="mt-5 grid gap-3">
            <Button href="/partner/courses">Publish course</Button>
            <Button href="/partner/sessions" variant="ghost">Schedule class</Button>
            <Button href="/partner/documents" variant="ghost">Update documents</Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
