"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import { Alert, Card, LoadingPanel, StatCard, formatCurrency } from "../../../components/ui";
import { api, getApiError, isRecord, readNumber, unwrapPayload } from "../../../lib/api";

type DashboardData = Record<string, unknown>;

const countMetrics = [
  { label: "Total users", keys: ["total_users", "totalUsers", "users", "userCount"], detail: "Registered accounts", tone: "blue" },
  { label: "Schools", keys: ["total_schools", "totalSchools", "schools", "schoolCount"], detail: "Partner schools", tone: "indigo" },
  { label: "Courses", keys: ["total_courses", "totalCourses", "courses", "courseCount"], detail: "Active and archived", tone: "green" },
  { label: "Bookings", keys: ["total_bookings", "totalBookings", "bookings", "bookingCount"], detail: "Marketplace requests", tone: "amber" },
  { label: "Complaints", keys: ["total_complaints", "totalComplaints", "complaints", "openComplaints"], detail: "Support workload", tone: "amber" },
  { label: "Reviews", keys: ["total_reviews", "totalReviews", "reviews", "reviewCount"], detail: "Customer feedback", tone: "blue" }
] as const;

const moneyMetrics = [
  { label: "Revenue", keys: ["revenue_total", "revenueTotal", "totalRevenue", "revenue", "grossRevenue"], detail: "Gross platform value", tone: "blue" },
  { label: "Commission", keys: ["commission_total", "commissionTotal", "totalCommission", "commission", "platformRevenue"], detail: "Platform earnings", tone: "green" },
  { label: "Payouts", keys: ["payout_total", "payoutTotal", "totalPayouts", "payouts", "schoolPayouts"], detail: "School settlements", tone: "indigo" }
] as const;

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setError("");
    setDashboard(null);
    void api.get("/api/admin/dashboard")
      .then((response) => {
        const payload = unwrapPayload<unknown>(response.data);
        const stats = isRecord(payload) && isRecord(payload.stats)
          ? payload.stats
          : isRecord(payload) && isRecord(payload.dashboard)
            ? payload.dashboard
            : payload;
        setDashboard(isRecord(stats) ? stats : {});
      })
      .catch((requestError) => setError(getApiError(requestError, "Unable to load dashboard metrics.")));
  }, [user]);

  const chartMetrics = countMetrics.slice(0, 4).map((metric) => ({ ...metric, value: pickMetric(dashboard, metric.keys) }));
  const maxValue = Math.max(...chartMetrics.map((metric) => metric.value), 1);

  return (
    <AdminShell title="Platform overview" eyebrow="Admin dashboard">
      {error ? <Alert>{error}</Alert> : null}
      {!dashboard && !error ? <LoadingPanel label="Loading dashboard metrics..." /> : null}
      {dashboard ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {countMetrics.map((metric) => (
              <StatCard key={metric.label} label={metric.label} value={String(pickMetric(dashboard, metric.keys))} detail={metric.detail} tone={metric.tone} />
            ))}
            {moneyMetrics.map((metric) => (
              <StatCard key={metric.label} label={metric.label} value={formatCurrency(pickMetric(dashboard, metric.keys))} detail={metric.detail} tone={metric.tone} />
            ))}
          </div>
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <p className="text-sm font-bold uppercase tracking-wide text-indigo-700">Platform pulse</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Marketplace activity</h2>
              <div className="mt-6 grid gap-4">
                {chartMetrics.map((metric, index) => (
                  <div key={metric.label}>
                    <div className="flex justify-between gap-3 text-sm font-semibold"><span>{metric.label}</span><span>{metric.value}</span></div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full bg-gradient-to-r ${index % 2 === 0 ? "from-blue-600 to-cyan-400" : "from-indigo-600 to-blue-400"}`} style={{ width: `${Math.max((metric.value / maxValue) * 100, 3)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-slate-950 via-indigo-900 to-blue-700 text-white">
              <p className="text-sm font-bold uppercase tracking-wide text-cyan-200">Quick workflow</p>
              <h2 className="mt-2 text-2xl font-black">Keep operations moving</h2>
              <div className="mt-5 grid gap-3">
                {["Review pending schools", "Check partner documents", "Resolve customer complaints", "Mark completed payouts"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg bg-white/10 p-3 ring-1 ring-white/10">
                    <span className="grid size-7 place-items-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">{index + 1}</span>
                    <span className="text-sm font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}

function pickMetric(data: DashboardData | null, keys: readonly string[]) {
  if (!data) return 0;
  for (const key of keys) {
    if (key in data) return readNumber(data[key]);
  }
  return 0;
}
