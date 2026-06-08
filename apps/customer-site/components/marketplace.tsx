"use client";

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, StatusBadge } from "./ui";
import { apiRequest, getApiErrorMessage } from "../lib/api";
import { API_ENDPOINTS } from "../lib/endpoints";
import { asList, money, numberValue, text, type ApiRecord } from "../lib/records";
import { ErrorBanner, LoadingState, PageIntro } from "./portal-ui";

type MarketplaceProps = {
  compact?: boolean;
  authenticated?: boolean;
};

type SchoolFilters = {
  location: string;
  vehicle_type: string;
  pickup_drop_available: string;
  lat: string;
  lng: string;
};

const emptyFilters: SchoolFilters = {
  location: "",
  vehicle_type: "",
  pickup_drop_available: "",
  lat: "",
  lng: ""
};

const vehicleTypes = [
  { label: "All vehicles", value: "" },
  { label: "Two Wheeler", value: "TWO_WHEELER" },
  { label: "Car", value: "CAR" },
  { label: "Heavy Vehicle", value: "HEAVY_VEHICLE" }
];

const pickupOptions = [
  { label: "Any pickup/drop", value: "" },
  { label: "Pickup/drop: Yes", value: "true" },
  { label: "Pickup/drop: No", value: "false" }
];

export function Marketplace({ compact = false, authenticated = false }: MarketplaceProps) {
  const router = useRouter();
  const [schools, setSchools] = useState<ApiRecord[]>([]);
  const [filters, setFilters] = useState<SchoolFilters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [geoMessage, setGeoMessage] = useState("");
  const [usingLocation, setUsingLocation] = useState(false);

  async function load(nextFilters: SchoolFilters) {
    setLoading(true);
    setError("");
    try {
      const query = schoolQueryString(nextFilters);
      const schoolPayload = await apiRequest<unknown>({
        url: `${API_ENDPOINTS.marketplace.schools}${query ? `?${query}` : ""}`
      });
      setSchools(asList(schoolPayload, ["schools", "items"]));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load approved schools."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const nextFilters = filtersFromLocation();
    setFilters(nextFilters);
    void load(nextFilters);
  }, []);

  function applyFilters(nextFilters: SchoolFilters) {
    const normalizedFilters = normalizeFilters(nextFilters);
    setFilters(normalizedFilters);
    setGeoMessage("");
    router.push(marketplaceHref(authenticated, normalizedFilters));
    void load(normalizedFilters);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters(filters);
  }

  function clearSearch() {
    applyFilters(emptyFilters);
  }

  function updateFilter(key: keyof SchoolFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setGeoMessage("Location access is not available in this browser.");
      return;
    }

    setUsingLocation(true);
    setGeoMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUsingLocation(false);
        applyFilters({
          ...filters,
          location: "",
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude)
        });
      },
      () => {
        setUsingLocation(false);
        setGeoMessage("Location permission was denied. Enter a city or locality instead.");
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  const activeCourseCount = useMemo(
    () => schools.reduce((total, school) => total + getCourseCount(school), 0),
    [schools]
  );
  const activeFilters = hasActiveFilters(filters);

  if (loading) return <LoadingState label="Finding approved schools..." />;

  return (
    <div>
      <PageIntro
        eyebrow="Verified marketplace"
        title="Approved driving schools"
        description="Browse admin-approved schools first, then choose courses from the selected school details page."
        action={<Button href={authenticated ? "/customer/marketplace" : "/schools"} variant="ghost">Browse all schools</Button>}
      />
      {error ? <ErrorBanner message={error} retry={() => void load(filters)} /> : null}

      <Card className="mt-6">
        <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto_auto]" onSubmit={submitSearch}>
          <Input
            value={filters.location}
            onChange={(event) => updateFilter("location", event.target.value)}
            placeholder="Enter your city or locality"
            aria-label="Enter your city or locality"
          />
          <select
            value={filters.vehicle_type}
            onChange={(event) => updateFilter("vehicle_type", event.target.value)}
            className="focus-ring min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm shadow-sm"
            aria-label="Vehicle type"
          >
            {vehicleTypes.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
          </select>
          <select
            value={filters.pickup_drop_available}
            onChange={(event) => updateFilter("pickup_drop_available", event.target.value)}
            className="focus-ring min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm shadow-sm"
            aria-label="Pickup/drop available"
          >
            {pickupOptions.map((option) => <option key={option.value || "any"} value={option.value}>{option.label}</option>)}
          </select>
          <Button type="submit" variant="dark">Search</Button>
          <Button type="button" variant="ghost" onClick={clearSearch}>Clear</Button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" variant="ghost" className="min-h-9 px-3 py-2" onClick={useCurrentLocation} disabled={usingLocation}>
            {usingLocation ? "Locating..." : "Use my location"}
          </Button>
          {geoMessage ? <p className="text-sm font-semibold text-amber-700">{geoMessage}</p> : null}
        </div>
      </Card>

      {!compact ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <MetricCard label="Approved schools" value={schools.length} tone="blue" />
          <MetricCard label="Active courses" value={activeCourseCount} tone="green" />
          <MetricCard label="Booking flow" value="Details first" tone="amber" />
        </section>
      ) : null}

      {!error && !schools.length ? (
        <Card className="mt-7 text-center">
          <h3 className="text-xl font-black text-slate-950">{activeFilters ? "No approved schools found in this location yet." : "No approved schools yet"}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{activeFilters ? "Try searching nearby city or locality." : "Approved schools will appear here after admin verification."}</p>
          {activeFilters ? <Button type="button" variant="ghost" className="mt-4" onClick={clearSearch}>Browse all schools</Button> : null}
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
                    <p className="text-sm text-slate-500">
                      Starts from <span className="font-black text-slate-950">{startingPriceLabel(school)}</span>
                      {readDistance(school) ? <span className="ml-2 text-xs font-semibold uppercase text-slate-400">{readDistance(school)}</span> : null}
                    </p>
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

function marketplaceHref(authenticated: boolean, filters: SchoolFilters) {
  const query = schoolQueryString(filters);
  const basePath = authenticated ? "/customer/marketplace" : "/schools";
  return query ? `${basePath}?${query}` : basePath;
}

function schoolQueryString(filters: SchoolFilters) {
  const params = new URLSearchParams();
  const normalized = normalizeFilters(filters);

  if (normalized.location) params.set("location", normalized.location);
  if (normalized.vehicle_type) params.set("vehicle_type", normalized.vehicle_type);
  if (normalized.pickup_drop_available) params.set("pickup_drop_available", normalized.pickup_drop_available);
  if (normalized.lat && normalized.lng) {
    params.set("lat", normalized.lat);
    params.set("lng", normalized.lng);
  }

  return params.toString();
}

function filtersFromLocation() {
  if (typeof window === "undefined") return emptyFilters;

  const params = new URLSearchParams(window.location.search);
  return normalizeFilters({
    location: params.get("location") || params.get("city") || params.get("q") || "",
    vehicle_type: params.get("vehicle_type") || "",
    pickup_drop_available: params.get("pickup_drop_available") || "",
    lat: params.get("lat") || "",
    lng: params.get("lng") || ""
  });
}

function normalizeFilters(filters: SchoolFilters): SchoolFilters {
  const vehicleType = vehicleTypes.some((option) => option.value === filters.vehicle_type)
    ? filters.vehicle_type
    : "";
  const pickup = ["true", "false"].includes(filters.pickup_drop_available)
    ? filters.pickup_drop_available
    : "";
  const lat = Number(filters.lat);
  const lng = Number(filters.lng);

  return {
    location: filters.location.trim(),
    vehicle_type: vehicleType,
    pickup_drop_available: pickup,
    lat: Number.isFinite(lat) ? String(lat) : "",
    lng: Number.isFinite(lng) ? String(lng) : ""
  };
}

function hasActiveFilters(filters: SchoolFilters) {
  const normalized = normalizeFilters(filters);
  return Boolean(
    normalized.location ||
    normalized.vehicle_type ||
    normalized.pickup_drop_available ||
    (normalized.lat && normalized.lng)
  );
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

function startingPriceLabel(school: ApiRecord) {
  const startingPrice = numberValue(school, "starting_price", "startingPrice");
  return startingPrice > 0 ? money(startingPrice) : "New";
}

function readDistance(school: ApiRecord) {
  const distance = numberValue(school, "distance_km", "distanceKm");
  return distance > 0 ? `${distance.toFixed(1)} km away` : "";
}

function cleanValue(value: string) {
  return value === "-" ? "" : value.trim();
}
