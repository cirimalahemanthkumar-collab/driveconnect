"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "../../components/ui";
import {
  createBooking,
  listCourses,
  listSchools,
  storageKeys,
  writeStorage,
  type Course,
  type School
} from "../../lib/local-api";

export default function CheckoutPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [customerName, setCustomerName] = useState("Aarav Sharma");
  const [customerMobile, setCustomerMobile] = useState("+919900001111");
  const [preferredStartDate, setPreferredStartDate] = useState("2026-06-05");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("18:00-19:00");
  const [pickupAddress, setPickupAddress] = useState("12 Residency Road, Bengaluru");
  const [notes, setNotes] = useState("Prefer calm traffic routes for first few lessons");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([listSchools("VERIFIED"), listCourses()])
      .then(([availableSchools, availableCourses]) => {
        setSchools(availableSchools);
        setCourses(availableCourses);
        const firstSchool = availableSchools[0];
        const firstCourse = availableCourses.find((course) => course.schoolId === firstSchool?.id);
        setSchoolId(firstSchool?.id ?? "");
        setCourseId(firstCourse?.id ?? "");
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const matchingCourses = useMemo(() => courses.filter((course) => course.schoolId === schoolId), [courses, schoolId]);
  const selectedSchool = schools.find((school) => school.id === schoolId);
  const selectedCourse = courses.find((course) => course.id === courseId);

  function chooseSchool(nextSchoolId: string) {
    setSchoolId(nextSchoolId);
    setCourseId(courses.find((course) => course.schoolId === nextSchoolId)?.id ?? "");
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const booking = await createBooking({
        customerName,
        customerMobile,
        schoolId,
        courseId,
        preferredStartDate,
        preferredTimeSlot,
        pickupAddress,
        notes
      });
      writeStorage(storageKeys.customerMobile, customerMobile);
      writeStorage(storageKeys.lastBooking, booking);
      router.push("/payment-success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create booking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <div>
          <p className="text-sm font-bold uppercase text-blue-600">Booking checkout</p>
          <h1 className="mt-1 text-4xl font-black">Reserve your driving course slot</h1>
          <p className="mt-3 text-slate-600">Your request is sent directly to the selected school for confirmation.</p>
        </div>
        <form className="grid gap-4" onSubmit={submitBooking}>
          <Card className="grid gap-4">
            <Input required placeholder="Customer name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            <Input required placeholder="Customer mobile" value={customerMobile} onChange={(event) => setCustomerMobile(event.target.value)} />
            <Select required value={schoolId} onChange={(event) => chooseSchool(event.target.value)}>
              <option value="">Select verified school</option>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.name} - {school.city}</option>)}
            </Select>
            <Select required value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value="">Select course</option>
              {matchingCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </Select>
            <Input required type="date" value={preferredStartDate} onChange={(event) => setPreferredStartDate(event.target.value)} />
            <Select value={preferredTimeSlot} onChange={(event) => setPreferredTimeSlot(event.target.value)}>
              <option>08:00-09:00</option>
              <option>11:00-12:00</option>
              <option>18:00-19:00</option>
            </Select>
            <Input placeholder="Pickup address" value={pickupAddress} onChange={(event) => setPickupAddress(event.target.value)} />
            <Input placeholder="Notes for school" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Card>
          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <Button type="submit" disabled={loading || submitting || !selectedCourse} className="w-full">
            {submitting ? "Recording booking..." : "Confirm mock payment and book"}
          </Button>
        </form>
      </section>
      <Card className="h-fit space-y-4">
        <p className="text-sm font-bold uppercase text-green-700">Live booking</p>
        <h2 className="text-2xl font-black">{selectedCourse?.title ?? (loading ? "Loading courses..." : "Select a course")}</h2>
        <p className="text-sm text-slate-500">{selectedSchool?.name ?? "Verified school"}</p>
        <div className="space-y-2 border-y border-slate-100 py-4 text-sm">
          <div className="flex justify-between"><span>Course fee</span><strong>Rs {selectedCourse?.price ?? 0}</strong></div>
          <div className="flex justify-between"><span>Advance payable</span><strong>Rs {selectedCourse?.advanceAmount ?? 0}</strong></div>
          <div className="flex justify-between"><span>Booking fee</span><strong>Rs 99</strong></div>
        </div>
        <p className="text-sm leading-6 text-slate-600">After checkout, open the partner site to accept the request and watch the confirmation update here.</p>
      </Card>
    </main>
  );
}
