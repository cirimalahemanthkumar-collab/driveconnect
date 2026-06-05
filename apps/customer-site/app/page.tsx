"use client";

import { Badge, Button, Card, DashboardStatCard } from "../components/ui";
import { LoadingState } from "../components/portal-ui";
import { useApiResource } from "../hooks/use-api-resource";
import { API_ENDPOINTS } from "../lib/endpoints";
import { money } from "../lib/records";

type FeaturedSchool = {
  id?: string;
  school_name?: string;
  schoolName?: string;
  city?: string | null;
  description?: string | null;
  pickup_drop_available?: boolean;
  pickupDropAvailable?: boolean;
  rating?: number | string | null;
  course_count?: number | string;
  courseCount?: number | string;
  starting_price?: number | string | null;
  startingPrice?: number | string | null;
};

type MarketplaceSummary = {
  approved_school_count?: number;
  approvedSchoolCount?: number;
  average_rating?: number | string | null;
  averageRating?: number | string | null;
  active_course_count?: number;
  activeCourseCount?: number;
  earliest_slot?: string | null;
  earliestSlot?: string | null;
  latest_slot?: string | null;
  latestSlot?: string | null;
  featured_schools?: FeaturedSchool[];
  featuredSchools?: FeaturedSchool[];
};

export default function LandingPage() {
  const summaryResource = useApiResource<MarketplaceSummary>(API_ENDPOINTS.marketplace.summary, {});
  const summary = summaryResource.data ?? {};
  const featuredSchools = Array.isArray(summary.featured_schools)
    ? summary.featured_schools
    : Array.isArray(summary.featuredSchools)
      ? summary.featuredSchools
      : [];
  const approvedSchoolCount = Number(summary.approved_school_count ?? summary.approvedSchoolCount ?? 0);
  const activeCourseCount = Number(summary.active_course_count ?? summary.activeCourseCount ?? 0);
  const averageRating = readPositiveNumber(summary.average_rating ?? summary.averageRating);
  const earliestSlot = summary.earliest_slot ?? summary.earliestSlot ?? null;
  const latestSlot = summary.latest_slot ?? summary.latestSlot ?? null;

  return (
    <main>
      <Hero />
      {summaryResource.loading ? <LoadingState label="Loading marketplace data..." /> : null}
      {!summaryResource.loading ? (
        <>
          {summaryResource.error ? (
            <section className="mx-auto max-w-7xl px-4 py-8">
              <Card>
                <p className="text-sm font-bold uppercase text-amber-700">Marketplace data unavailable</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Real school data will appear here when the backend responds.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">No demo schools or static numbers are shown on this page.</p>
              </Card>
            </section>
          ) : (
            <>
              <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 md:grid-cols-3">
                <DashboardStatCard
                  label="Verified schools nearby"
                  value={String(Number.isFinite(approvedSchoolCount) ? approvedSchoolCount : 0)}
                  tone="blue"
                  delta={`${Number.isFinite(activeCourseCount) ? activeCourseCount : 0} active courses`}
                />
                <DashboardStatCard
                  label="Average rating"
                  value={averageRating ? averageRating.toFixed(1) : "New"}
                  tone="green"
                  delta={averageRating ? "From customer reviews" : "Awaiting reviews"}
                />
                <DashboardStatCard
                  label="Flexible slots"
                  value={earliestSlot ? formatSlot(earliestSlot) : "Available"}
                  tone="amber"
                  delta={earliestSlot && latestSlot ? `to ${formatSlot(latestSlot)}` : "Schools add schedules"}
                />
              </section>
              <section className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase text-blue-600">Approved schools</p>
                    <h2 className="mt-1 text-3xl font-black text-slate-950">Schools ready for booking</h2>
                  </div>
                  <Button href="/schools" variant="dark">Browse all schools</Button>
                </div>
                {featuredSchools.length ? (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {featuredSchools.slice(0, 3).map((school) => <PublicSchoolCard key={school.id ?? school.school_name} school={school} />)}
                  </div>
                ) : (
                  <Card>
                    <p className="text-sm leading-6 text-slate-600">No approved schools are available yet. Once schools are approved, they will appear here automatically.</p>
                  </Card>
                )}
              </section>
            </>
          )}
        </>
      ) : null}
    </main>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[74vh] overflow-hidden">
      <img src="/images/hero-driveconnect.png" alt="Driving instructor and learner using DriveConnect" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent" />
      <div className="relative mx-auto flex min-h-[74vh] max-w-7xl items-center px-4 py-16">
        <div className="max-w-2xl text-white">
          <p className="text-sm font-bold uppercase text-amber-300">Verified driving school marketplace</p>
          <h1 className="mt-4 text-5xl font-black leading-tight md:text-7xl">DriveConnect</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-blue-50">Discover approved driving schools, compare real marketplace details, book classes, and track your learning journey in one place.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="/schools" variant="secondary">Browse all schools</Button>
            <Button href="/login" variant="ghost">Login</Button>
            <Button href="/register" variant="ghost">Join DriveConnect</Button>
          </div>
          <p className="mt-6 max-w-xl text-sm leading-6 text-blue-100">DriveConnect offers discovery, booking, class tracking, support, ratings, and licence process guidance. It does not guarantee licence outcomes.</p>
        </div>
      </div>
    </section>
  );
}

function PublicSchoolCard({ school }: { school: FeaturedSchool }) {
  const rating = readPositiveNumber(school.rating);
  const startingPrice = readPositiveNumber(school.starting_price ?? school.startingPrice);
  const courseCount = Number(school.course_count ?? school.courseCount ?? 0);
  const pickup = Boolean(school.pickup_drop_available ?? school.pickupDropAvailable);

  return (
    <Card className="flex h-full flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-950">{school.school_name ?? school.schoolName ?? "Approved school"}</h3>
            <p className="mt-1 text-sm text-slate-500">{school.city || "Location available on profile"}</p>
          </div>
          {rating ? <Badge tone="amber">{rating.toFixed(1)} / 5</Badge> : <Badge tone="slate">New</Badge>}
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{school.description || "School details will be available on the profile page."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={pickup ? "green" : "slate"}>{pickup ? "Pickup/drop" : "Self visit"}</Badge>
          <Badge tone="blue">{Number.isFinite(courseCount) ? courseCount : 0} courses</Badge>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-500">Starts from <span className="font-black text-slate-950">{startingPrice ? money(startingPrice) : "New"}</span></p>
        <Button href={`/schools/${school.id}`} variant="dark" className="min-h-10 px-4 py-2">View school</Button>
      </div>
    </Card>
  );
}

function readPositiveNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function formatSlot(value: string) {
  const [hour = "", minute = ""] = value.split(":");
  if (!hour) return value;

  const numericHour = Number(hour);
  if (!Number.isFinite(numericHour)) return value;

  const suffix = numericHour >= 12 ? "PM" : "AM";
  const displayHour = numericHour % 12 || 12;
  return `${displayHour}:${minute || "00"} ${suffix}`;
}
