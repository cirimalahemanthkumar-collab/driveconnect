"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, StatusBadge } from "../../../components/ui";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, asRecord, money, numberValue, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, LoadingState, PageIntro } from "../../../components/portal-ui";

type SchoolDetailsPayload = {
  school?: ApiRecord;
  courses?: unknown[];
};

export default function SchoolDetailsClient({ schoolId }: { schoolId: string }) {
  const [school, setSchool] = useState<ApiRecord>({});
  const [courses, setCourses] = useState<ApiRecord[]>([]);
  const [bookingDates, setBookingDates] = useState<Record<string, string>>({});
  const [bookingCourseId, setBookingCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const payload = await apiRequest<SchoolDetailsPayload>({ url: `${API_ENDPOINTS.marketplace.schools}/${schoolId}` });
      const schoolRecord = asRecord(payload.school ?? payload);
      setSchool(schoolRecord);
      setCourses(asList(payload, ["courses", "items"]));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load school details."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [schoolId]);

  async function bookCourse(course: ApiRecord) {
    const courseId = readId(course);
    const preferredStartDate = bookingDates[courseId];

    if (!preferredStartDate) {
      setBookingError("Choose a preferred start date before booking.");
      setBookingSuccess("");
      return;
    }

    setBookingCourseId(courseId);
    setBookingError("");
    setBookingSuccess("");
    try {
      await apiRequest({
        url: API_ENDPOINTS.customer.bookings,
        method: "POST",
        data: {
          course_id: courseId,
          preferred_start_date: preferredStartDate
        }
      });
      setBookingDates((current) => ({ ...current, [courseId]: "" }));
      setBookingSuccess("Booking request created. The school will review it soon.");
    } catch (requestError) {
      setBookingError(getApiErrorMessage(requestError, "Unable to create booking."));
    } finally {
      setBookingCourseId("");
    }
  }

  if (loading) return <LoadingState label="Loading school details..." />;

  const schoolName = readValue(school, "school_name", "schoolName", "name", "title") || "Driving school";
  const rating = numberValue(school, "average_rating", "averageRating", "rating");
  const reviews = numberValue(school, "total_reviews", "totalReviews");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <PageIntro
        eyebrow="School details"
        title={schoolName}
        description="Review this approved school's profile, then choose from its active course packages."
        action={<Button href="/customer/marketplace" variant="ghost">Back to marketplace</Button>}
      />
      {error ? <ErrorBanner message={error} retry={() => void load()} /> : null}
      {bookingError ? <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">{bookingError}</p> : null}
      {bookingSuccess ? <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700 ring-1 ring-green-100">{bookingSuccess}</p> : null}

      {!error ? (
        <>
          <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <StatusBadge status={text(school, "verification_status", "verificationStatus", "status")} />
                  <h1 className="mt-4 text-3xl font-black text-slate-950">{schoolName}</h1>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{readValue(school, "description", "about") || "School description not added yet."}</p>
                </div>
                {rating > 0 ? <p className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800 ring-1 ring-amber-100">{rating.toFixed(1)} / 5</p> : null}
              </div>

              <dl className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoItem label="Address" value={readValue(school, "address")} />
                <InfoItem label="City / state" value={[readValue(school, "city"), readValue(school, "state")].filter(Boolean).join(", ")} />
                <InfoItem label="Phone" value={readValue(school, "phone", "school_phone", "schoolPhone")} />
                <InfoItem label="Email" value={readValue(school, "email", "school_email", "schoolEmail")} />
                <InfoItem label="Pickup/drop" value={hasPickup(school) ? "Available" : "Not available"} />
                <InfoItem label="Reviews" value={reviews > 0 ? `${reviews} reviews` : "Not reviewed yet"} />
                <InfoItem label="Admin verification" value={text(school, "verification_status", "verificationStatus", "status")} />
              </dl>
            </Card>

            <Card className="h-fit">
              <p className="text-sm font-bold uppercase text-blue-600">Course packages</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{courses.length}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Only active courses from this approved school are shown here.</p>
              <Button href="/customer/bookings" variant="ghost" className="mt-5 w-full">View bookings</Button>
            </Card>
          </section>

          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase text-green-700">Available packages</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Courses at {schoolName}</h2>
              </div>
            </div>

            {!courses.length ? (
              <Card className="mt-5">
                <p className="text-sm leading-6 text-slate-600">This school does not have active course packages right now.</p>
              </Card>
            ) : (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {courses.map((course, index) => (
                  <CoursePackageCard
                    key={`${readId(course)}-${index}`}
                    course={course}
                    preferredDate={bookingDates[readId(course)] ?? ""}
                    saving={bookingCourseId === readId(course)}
                    onDateChange={(value) => setBookingDates((current) => ({ ...current, [readId(course)]: value }))}
                    onBook={() => void bookCourse(course)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

function CoursePackageCard({
  course,
  preferredDate,
  saving,
  onDateChange,
  onBook
}: {
  course: ApiRecord;
  preferredDate: string;
  saving: boolean;
  onDateChange: (value: string) => void;
  onBook: () => void;
}) {
  const courseName = readValue(course, "course_name", "courseName", "title", "name") || "Course package";

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-blue-600">{readValue(course, "course_type", "courseType", "type") || "Course"}</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{courseName}</h3>
        </div>
        <p className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-100">Active</p>
      </div>

      <p className="text-sm leading-6 text-slate-600">{readValue(course, "description") || "Course description not added yet."}</p>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <MiniStat label="Vehicle type" value={formatEnum(readValue(course, "vehicle_type", "vehicleType"))} />
        <MiniStat label="Transmission" value={formatEnum(readValue(course, "transmission"))} />
        <MiniStat label="Duration days" value={readValue(course, "duration_days", "durationDays", "days") || "0"} />
        <MiniStat label="Total sessions" value={readValue(course, "total_sessions", "totalSessions", "sessions") || "0"} />
        <MiniStat label="Price" value={money(course.price)} />
        <MiniStat label="Advance amount" value={money(course.advance_amount ?? course.advanceAmount)} />
      </dl>

      <div className="mt-auto grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_auto_auto]">
        <Input
          aria-label={`Preferred start date for ${courseName}`}
          type="date"
          value={preferredDate}
          onChange={(event) => onDateChange(event.target.value)}
        />
        <Button disabled={saving} onClick={onBook}>{saving ? "Booking..." : "Book now"}</Button>
        <Button href="/customer/bookings" variant="ghost">View bookings</Button>
      </div>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "Not added"}</dd>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-black text-slate-950">{value || "Not added"}</dd>
    </div>
  );
}

function readId(record: ApiRecord) {
  return readValue(record, "id", "_id", "course_id", "courseId");
}

function readValue(record: ApiRecord, ...keys: string[]) {
  const value = text(record, ...keys);
  return value === "-" ? "" : value.trim();
}

function hasPickup(school: ApiRecord) {
  return Boolean(school.pickup_drop_available ?? school.pickupDropAvailable ?? school.pickupAvailable);
}

function formatEnum(value: string) {
  if (!value) return "Not added";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
