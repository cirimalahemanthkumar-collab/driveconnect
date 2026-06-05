"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, StatusBadge } from "./ui";
import { apiRequest, getApiErrorMessage } from "../lib/api";
import { API_ENDPOINTS } from "../lib/endpoints";
import { asList, numberValue, text, type ApiRecord } from "../lib/records";
import { ErrorBanner, LoadingState, PageIntro } from "./portal-ui";

type MarketplaceProps = {
  compact?: boolean;
  authenticated?: boolean;
};

export function Marketplace({ compact = false, authenticated = false }: MarketplaceProps) {
  const router = useRouter();
  const [schools, setSchools] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const schoolPayload = await apiRequest<unknown>({ url: API_ENDPOINTS.marketplace.schools });
      setSchools(asList(schoolPayload, ["schools", "items"]));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load approved schools."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const activeCourseCount = useMemo(
    () => schools.reduce((total, school) => total + getCourseCount(school), 0),
    [schools]
  );

  if (loading) return <LoadingState label="Finding approved schools..." />;

  return (
    <div>
      <PageIntro
        eyebrow="Verified marketplace"
        title="Approved driving schools"
        description="Browse admin-approved schools first, then choose courses from the selected school details page."
      />
      {error ? <ErrorBanner message={error} retry={() => void load()} /> : null}

      {!compact ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <MetricCard label="Approved schools" value={schools.length} tone="blue" />
          <MetricCard label="Active courses" value={activeCourseCount} tone="green" />
          <MetricCard label="Booking flow" value="Details first" tone="amber" />
        </section>
      ) : null}

      {!error && !schools.length ? (
        <Card className="mt-7 text-center">
          <h3 className="text-xl font-black text-slate-950">No approved schools yet</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Approved schools will appear here after admin verification.</p>
        </Card>
      ) : null}

      <section className="mt-7 grid gap-5 md:grid-cols-2">
        {schools.map((school, index) => {
          const schoolId = cleanValue(text(school, "id", "_id", "school_id", "schoolId"));
          const detailsPath = schoolId ? `/customer/marketplace/${schoolId}` : "/customer/marketplace";
          const detailsHref = authenticated ? detailsPath : loginRedirectHref(detailsPath);

          return (
            <div
              key={`${schoolId || text(school, "school_name", "schoolName", "name")}-${index}`}
              className="cursor-pointer rounded-lg outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={() => router.push(detailsHref)}
              onKeyDown={(event) => openOnKeyboard(event, () => router.push(detailsHref))}
              role="link"
              tabIndex={0}
            >
              <Card className="h-full overflow-hidden p-0">
                <div className={`h-3 bg-gradient-to-r ${index % 2 ? "from-indigo-500 via-cyan-400 to-amber-300" : "from-blue-600 via-cyan-500 to-green-400"}`} />
                <div className="flex h-full flex-col gap-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">{readSchoolName(school)}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{readLocation(school)}</p>
                    </div>
                    <StatusBadge status={text(school, "verification_status", "verificationStatus", "status")} />
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-slate-600">{readDescription(school)}</p>

                  <div className="flex flex-wrap gap-2">
                    {hasRating(school) ? <BadgeText tone="amber">{getRating(school)} / 5</BadgeText> : null}
                    <BadgeText tone="slate">{getCourseCount(school)} courses</BadgeText>
                    <BadgeText tone={hasPickup(school) ? "green" : "slate"}>{hasPickup(school) ? "Pickup available" : "Pickup not available"}</BadgeText>
                    <BadgeText tone="blue">Approved</BadgeText>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">Courses shown inside school details</p>
                    <Button href={detailsHref} variant="dark" className="min-h-10 px-4 py-2">View details</Button>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function loginRedirectHref(redirectPath: string) {
  return `/login?redirect=${encodeURIComponent(redirectPath)}`;
}

function MetricCard({ label, value, tone }: { label: string; value: string | number; tone: "blue" | "green" | "amber" }) {
  const bars = {
    blue: "from-blue-500 to-cyan-400",
    green: "from-green-500 to-emerald-300",
    amber: "from-amber-400 to-orange-400"
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className={`h-2 bg-gradient-to-r ${bars[tone]}`} />
      <div className="p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      </div>
    </Card>
  );
}

function BadgeText({ children, tone }: { children: React.ReactNode; tone: "blue" | "green" | "amber" | "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-green-50 text-green-700 ring-green-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200"
  };

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>{children}</span>;
}

function openOnKeyboard(event: KeyboardEvent<HTMLDivElement>, action: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

function readSchoolName(school: ApiRecord) {
  return cleanValue(text(school, "school_name", "schoolName", "name", "title")) || "Unnamed school";
}

function readLocation(school: ApiRecord) {
  const city = cleanValue(text(school, "city"));
  const state = cleanValue(text(school, "state"));
  return [city, state].filter(Boolean).join(", ") || "Location not added";
}

function readDescription(school: ApiRecord) {
  return cleanValue(text(school, "description", "about")) || "School description not added yet.";
}

function getCourseCount(school: ApiRecord) {
  return numberValue(school, "course_count", "courseCount", "courses_count", "total_courses", "totalCourses");
}

function getRating(school: ApiRecord) {
  return numberValue(school, "average_rating", "averageRating", "rating").toFixed(1);
}

function hasRating(school: ApiRecord) {
  return numberValue(school, "average_rating", "averageRating", "rating") > 0;
}

function hasPickup(school: ApiRecord) {
  return Boolean(school.pickup_drop_available ?? school.pickupDropAvailable ?? school.pickupAvailable);
}

function cleanValue(value: string) {
  return value === "-" ? "" : value.trim();
}
