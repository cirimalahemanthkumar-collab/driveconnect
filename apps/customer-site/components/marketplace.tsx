"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, DashboardStatCard, StatusBadge } from "@/components/ui";
import { apiRequest, getApiErrorMessage } from "../lib/api";
import { API_ENDPOINTS } from "../lib/endpoints";
import { asList, money, numberValue, text, type ApiRecord } from "../lib/records";
import { ErrorBanner, LoadingState, PageIntro } from "./portal-ui";

export function Marketplace({ compact = false }: { compact?: boolean }) {
  const [schools, setSchools] = useState<ApiRecord[]>([]);
  const [courses, setCourses] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [schoolPayload, coursePayload] = await Promise.all([
        apiRequest<unknown>({ url: API_ENDPOINTS.marketplace.schools }),
        apiRequest<unknown>({ url: API_ENDPOINTS.marketplace.courses })
      ]);
      setSchools(asList(schoolPayload, ["schools", "items"]));
      setCourses(asList(coursePayload, ["courses", "items"]));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load the marketplace."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <LoadingState label="Finding verified schools and courses..." />;

  return (
    <div>
      <PageIntro
        eyebrow="Verified marketplace"
        title="Driving schools and course packages"
        description="Compare verified schools, course formats, and transparent pricing before booking."
      />
      {error ? <ErrorBanner message={error} retry={() => void load()} /> : null}

      {!compact ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <DashboardStatCard label="Available schools" value={String(schools.length)} delta="Verified" tone="blue" />
          <DashboardStatCard label="Course packages" value={String(courses.length)} delta="Live" tone="green" />
          <DashboardStatCard label="Flexible learning" value="1 app" delta="Track it" tone="amber" />
        </section>
      ) : null}

      <section className="mt-7 grid gap-5 md:grid-cols-2">
        {schools.map((school, index) => (
          <Card key={text(school, "id", "_id", "slug") + index} className="overflow-hidden p-0">
            <div className={`h-3 bg-gradient-to-r ${index % 2 ? "from-indigo-500 via-cyan-400 to-amber-300" : "from-blue-600 via-cyan-500 to-green-400"}`} />
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-slate-950">{text(school, "name", "schoolName")}</h3>
                  <p className="mt-1 text-sm text-slate-500">{text(school, "city", "address", "location")}</p>
                </div>
                <StatusBadge status={text(school, "verificationStatus", "status")} />
              </div>
              <p className="text-sm leading-6 text-slate-600">{text(school, "description", "about")}</p>
              <div className="flex flex-wrap gap-2">
                <Badge tone="amber">{numberValue(school, "rating").toFixed(1)} / 5</Badge>
                <Badge tone="green">Verified listing</Badge>
                {school.pickupAvailable ? <Badge tone="blue">Pickup available</Badge> : null}
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="mt-9">
        <PageIntro eyebrow="Course catalogue" title="Choose a package that fits your schedule" />
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {courses.map((course, index) => (
            <Card key={text(course, "id", "_id") + index} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase text-blue-600">{text(course, "courseType", "type", "vehicleType")}</p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">{text(course, "title", "name")}</h3>
                </div>
                <Badge tone="green">{text(course, "totalSessions", "sessions")} sessions</Badge>
              </div>
              <p className="text-sm leading-6 text-slate-600">{text(course, "description", "durationDays", "duration")}</p>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-lg font-black text-slate-950">{money(course.price ?? course.amount)}</p>
                <Button href="/customer/bookings" variant="secondary">View bookings</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

