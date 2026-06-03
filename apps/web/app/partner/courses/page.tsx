"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Badge, Button, Card, Input, Select, SidebarLayout } from "../../../components/ui";
import {
  createPartnerCourse,
  getPartnerCourses,
  readStorage,
  storageKeys,
  type Course,
  type PartnerSession
} from "../../../lib/local-api";

const links = [
  { href: "/partner/dashboard", label: "Overview" },
  { href: "/partner/courses", label: "Courses" },
  { href: "/partner/bookings", label: "Bookings" },
  { href: "/partner/instructors", label: "Instructors" },
  { href: "/partner/vehicles", label: "Vehicles" },
  { href: "/partner/earnings", label: "Earnings" }
];

export default function PartnerCoursesPage() {
  const [session, setSession] = useState<PartnerSession | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({
    title: "Evening Beginner Pack",
    courseType: "BEGINNER" as "BEGINNER" | "REFRESHER" | "ADVANCED",
    vehicleType: "FOUR_WHEELER" as "FOUR_WHEELER" | "TWO_WHEELER" | "BOTH",
    totalSessions: "12",
    durationDays: "18",
    price: "7800",
    advanceAmount: "2200",
    pickupIncluded: "true"
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedSession = readStorage<PartnerSession>(storageKeys.partner);
    setSession(savedSession);
    if (savedSession) void loadCourses(savedSession);
  }, []);

  async function loadCourses(activeSession = session) {
    if (!activeSession) return;
    try {
      setCourses(await getPartnerCourses(activeSession.token));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load courses.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setError("");
    try {
      await createPartnerCourse(session.token, {
        title: form.title,
        courseType: form.courseType,
        vehicleType: form.vehicleType,
        totalSessions: Number(form.totalSessions),
        durationDays: Number(form.durationDays),
        price: Number(form.price),
        advanceAmount: Number(form.advanceAmount),
        pickupIncluded: form.pickupIncluded === "true"
      });
      await loadCourses(session);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to add course.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SidebarLayout title={session?.school.name ?? "Courses"} role="Partner dashboard" links={links}>
      <div className="mb-5">
        <p className="text-sm font-bold uppercase text-green-700">Course catalogue</p>
        <h2 className="mt-1 text-3xl font-black">Publish packages customers can book</h2>
      </div>
      {!session ? <Card className="mb-5"><p className="font-semibold">Partner login required.</p><Button href="/partner/login" className="mt-4">Partner login</Button></Card> : null}
      {session ? (
        <form onSubmit={submit}>
          <Card className="mb-5 grid gap-3 md:grid-cols-4">
            <Input required placeholder="Course title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <Select value={form.courseType} onChange={(event) => setForm({ ...form, courseType: event.target.value as typeof form.courseType })}><option>BEGINNER</option><option>REFRESHER</option><option>ADVANCED</option></Select>
            <Select value={form.vehicleType} onChange={(event) => setForm({ ...form, vehicleType: event.target.value as typeof form.vehicleType })}><option>FOUR_WHEELER</option><option>TWO_WHEELER</option><option>BOTH</option></Select>
            <Input required placeholder="Sessions" value={form.totalSessions} onChange={(event) => setForm({ ...form, totalSessions: event.target.value })} />
            <Input required placeholder="Duration days" value={form.durationDays} onChange={(event) => setForm({ ...form, durationDays: event.target.value })} />
            <Input required placeholder="Price" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            <Input required placeholder="Advance" value={form.advanceAmount} onChange={(event) => setForm({ ...form, advanceAmount: event.target.value })} />
            <Select value={form.pickupIncluded} onChange={(event) => setForm({ ...form, pickupIncluded: event.target.value })}><option value="true">Pickup included</option><option value="false">Self visit</option></Select>
            <Button type="submit" disabled={submitting} className="md:col-span-4">{submitting ? "Publishing..." : "Add bookable course"}</Button>
          </Card>
        </form>
      ) : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="grid gap-5 md:grid-cols-2">
        {courses.map((course) => (
          <Card key={course.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-sm font-semibold uppercase text-green-700">{course.courseType}</p><h3 className="mt-1 text-xl font-black">{course.title}</h3></div>
              <Badge tone={course.pickupIncluded ? "green" : "slate"}>{course.pickupIncluded ? "Pickup included" : "Self visit"}</Badge>
            </div>
            <p className="text-sm text-slate-600">{course.vehicleType.replace("_", " ")} - {course.totalSessions} sessions across {course.durationDays} days</p>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4"><p className="text-sm text-slate-500">Advance Rs {course.advanceAmount}</p><p className="text-lg font-black">Rs {course.price}</p></div>
          </Card>
        ))}
      </div>
    </SidebarLayout>
  );
}
