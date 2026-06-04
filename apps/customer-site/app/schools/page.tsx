"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type School = {
  id?: string;
  school_id?: string;
  name?: string;
  school_name?: string;
  schoolName?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  average_rating?: string | number;
  averageRating?: string | number;
  total_reviews?: string | number;
  totalReviews?: string | number;
  status?: string;
  verification_status?: string;
  verificationStatus?: string;
  total_courses?: string | number;
  course_count?: string | number;
  courses_count?: string | number;
};

type Course = {
  id?: string;
  school_id?: string;
  schoolId?: string;
  course_name?: string;
  name?: string;
  vehicle_type?: string;
  vehicleType?: string;
  transmission?: string;
  total_amount?: string | number;
  price?: string | number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  "https://driveconnect-backend-zodo.onrender.com";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMarketplace() {
    setLoading(true);
    setError("");

    try {
      const schoolResponse = await fetch(`${API_BASE}/api/marketplace/schools`, {
        cache: "no-store",
      });

      const schoolPayload = await schoolResponse.json();

      if (!schoolResponse.ok || schoolPayload?.success === false) {
        throw new Error(schoolPayload?.message || "Unable to load schools.");
      }

      const loadedSchools: School[] = Array.isArray(schoolPayload?.schools)
        ? schoolPayload.schools
        : Array.isArray(schoolPayload?.data)
          ? schoolPayload.data
          : [];

      setSchools(loadedSchools);

      try {
        const courseResponse = await fetch(`${API_BASE}/api/marketplace/courses`, {
          cache: "no-store",
        });

        const coursePayload = await courseResponse.json();

        const loadedCourses: Course[] = Array.isArray(coursePayload?.courses)
          ? coursePayload.courses
          : Array.isArray(coursePayload?.data)
            ? coursePayload.data
            : [];

        setCourses(loadedCourses);
      } catch {
        setCourses([]);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load marketplace."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMarketplace();
  }, []);

  const courseCount = useMemo(() => {
    if (courses.length > 0) return courses.length;

    return schools.reduce((total, school) => {
      return total + Number(school.total_courses || school.course_count || school.courses_count || 0);
    }, 0);
  }, [courses, schools]);

  return (
    <main className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-blue-50 via-emerald-50 to-amber-50 px-4 py-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-wide text-blue-700">
            Verified Marketplace
          </p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">
            Driving schools and course packages
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Compare verified schools, course formats, and transparent pricing before booking.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <StatCard
            color="from-blue-500 to-cyan-500"
            label="Available schools"
            value={schools.length}
            tag="Verified"
          />
          <StatCard
            color="from-green-500 to-emerald-400"
            label="Course packages"
            value={courseCount}
            tag="Live"
          />
          <StatCard
            color="from-yellow-400 to-orange-500"
            label="Flexible learning"
            value="1 app"
            tag="Track it"
          />
        </div>

        {loading ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center font-semibold text-slate-600 shadow-sm">
            Loading verified schools...
          </div>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-2xl bg-red-50 p-5 font-semibold text-red-700">
            {error}
            <button
              type="button"
              onClick={() => void loadMarketplace()}
              className="ml-4 rounded-lg bg-white px-4 py-2 text-sm font-bold text-red-700 shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!loading && !error && schools.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              No schools available yet
            </h2>
            <p className="mt-2 text-slate-600">
              Verified driving schools will appear here after admin approval.
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {schools.map((school) => {
            const schoolId = getSchoolId(school);
            const schoolName = getSchoolName(school);
            const rating = getRating(school);
            const city = getValue(school.city);
            const state = getValue(school.state);
            const description = getValue(school.description) || "Driving school";
            const reviewCount = getValue(school.total_reviews ?? school.totalReviews) || "0";
            const schoolCourses = getCoursesForSchool(courses, schoolId);

            return (
              <article
                key={schoolId || schoolName}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
              >
                <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-400" />

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-950">
                        {schoolName}
                      </h2>
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        {[city, state].filter(Boolean).join(", ") || "Location not added"}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                      Verified
                    </span>
                  </div>

                  <p className="mt-5 leading-7 text-slate-600">
                    {description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
                      {rating} / 5
                    </span>
                    <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
                      {reviewCount} reviews
                    </span>
                    <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                      {schoolCourses.length || Number(school.total_courses || school.course_count || 0)} courses
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={schoolId ? `/schools/${schoolId}` : "/schools"}
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm"
                    >
                      View school
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm"
                    >
                      Login to book
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <section className="mt-12">
          <p className="text-sm font-black uppercase tracking-wide text-blue-700">
            Course Catalogue
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Choose a package that fits your schedule
          </h2>

          {courses.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-white p-6 text-slate-600 shadow-sm">
              No course packages added yet. Ask the school owner to add courses from the partner dashboard.
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course.id || `${course.school_id}-${course.course_name}`}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
                >
                  <h3 className="text-xl font-black text-slate-950">
                    {getValue(course.course_name ?? course.name) || "Course package"}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {getValue(course.vehicle_type ?? course.vehicleType)}{" "}
                    {getValue(course.transmission)}
                  </p>
                  <p className="mt-4 text-2xl font-black text-blue-700">
                    ₹{getValue(course.total_amount ?? course.price) || "Contact"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function StatCard({
  color,
  label,
  value,
  tag,
}: {
  color: string;
  label: string;
  value: string | number;
  tag: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className={`h-2 rounded-full bg-gradient-to-r ${color}`} />
      <p className="mt-6 text-slate-500">{label}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-4xl font-black text-slate-950">{value}</p>
        <span className="rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600">
          {tag}
        </span>
      </div>
    </div>
  );
}

function getSchoolName(school: School) {
  return (
    getValue(school.school_name) ||
    getValue(school.name) ||
    getValue(school.schoolName) ||
    "Unnamed school"
  );
}

function getSchoolId(school: School) {
  return getValue(school.id) || getValue(school.school_id);
}

function getRating(school: School) {
  return getValue(school.average_rating ?? school.averageRating) || "0.0";
}

function getCoursesForSchool(courses: Course[], schoolId: string) {
  if (!schoolId) return [];

  return courses.filter((course) => {
    return getValue(course.school_id) === schoolId || getValue(course.schoolId) === schoolId;
  });
}

function getValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const text = String(value).trim();

  if (!text || text === "-") return "";

  return text;
}