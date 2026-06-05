"use client";

import { Button, Card, DashboardStatCard, StatusBadge } from "../../../components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, dateText, nestedText, text } from "../../../lib/records";
import { ErrorBanner, LoadingState, PageIntro } from "../../../components/portal-ui";

export default function CustomerDashboardPage() {
  const bookingsResource = useApiResource<unknown>(API_ENDPOINTS.customer.bookings, []);
  const paymentsResource = useApiResource<unknown>(API_ENDPOINTS.customer.payments, []);
  const sessionsResource = useApiResource<unknown>(API_ENDPOINTS.customer.sessions, []);
  const notificationsResource = useApiResource<unknown>(API_ENDPOINTS.customer.notifications, []);
  const bookings = asList(bookingsResource.data, ["bookings", "items"]);
  const payments = asList(paymentsResource.data, ["payments", "items"]);
  const sessions = asList(sessionsResource.data, ["sessions", "items"]);
  const notifications = asList(notificationsResource.data, ["notifications", "items"]);
  const loading = bookingsResource.loading || paymentsResource.loading || sessionsResource.loading || notificationsResource.loading;
  const error = bookingsResource.error || paymentsResource.error || sessionsResource.error || notificationsResource.error;

  if (loading) return <LoadingState label="Preparing your learner dashboard..." />;

  return (
    <div>
      <PageIntro
        eyebrow="Customer dashboard"
        title="Your learning journey, neatly tracked"
        description="Stay on top of bookings, classes, payments, and new updates from your school."
        action={<Button href="/customer/marketplace" variant="secondary">Browse schools</Button>}
      />
      {error ? <ErrorBanner message={error} /> : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="Bookings" value={String(bookings.length)} delta="Live" tone="blue" href="/customer/bookings" />
        <DashboardStatCard label="Payments" value={String(payments.length)} delta="Tracked" tone="green" href="/customer/payments" />
        <DashboardStatCard label="Sessions" value={String(sessions.length)} delta="Classes" tone="amber" href="/customer/sessions" />
        <DashboardStatCard label="Notifications" value={String(notifications.length)} delta="Updates" tone="indigo" href="/customer/notifications" />
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase text-blue-600">Latest requests</p>
              <h3 className="mt-1 text-2xl font-black text-slate-950">Recent bookings</h3>
            </div>
            <Button href="/customer/bookings" variant="ghost">View all</Button>
          </div>
          <div className="mt-4 grid gap-4">
            {bookings.slice(0, 3).map((booking, index) => (
              <Card key={text(booking, "id", "_id") + index} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <StatusBadge status={text(booking, "status")} />
                  <h4 className="mt-3 text-lg font-black text-slate-950">{nestedText(booking, "course", "title", "name") !== "-" ? nestedText(booking, "course", "title", "name") : text(booking, "courseName", "courseTitle")}</h4>
                  <p className="mt-1 text-sm text-slate-500">{nestedText(booking, "school", "name") !== "-" ? nestedText(booking, "school", "name") : text(booking, "schoolName")}</p>
                </div>
                <p className="text-sm font-semibold text-slate-500">{dateText(booking.createdAt)}</p>
              </Card>
            ))}
            {!bookings.length ? <Card><p className="text-sm text-slate-600">No bookings yet. Explore the marketplace when you are ready.</p></Card> : null}
          </div>
        </div>
        <Card>
          <p className="text-sm font-bold uppercase text-green-700">Next steps</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">Keep moving forward</h3>
          <div className="mt-5 grid gap-3 text-sm">
            <Button href="/customer/sessions">Open class sessions</Button>
            <Button href="/customer/payments" variant="ghost">Review payments</Button>
            <Button href="/customer/complaints" variant="ghost">Contact support</Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
