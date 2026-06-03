"use client";

import { useEffect, useState } from "react";
import { Button, Card, SidebarLayout, StatusBadge } from "../../../components/ui";
import {
  listSchools,
  readStorage,
  storageKeys,
  updateSchoolStatus,
  type AdminSession,
  type School
} from "../../../lib/local-api";

const links = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/school-verification", label: "School verification" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/complaints", label: "Complaints" }
];

export default function AdminSchoolVerificationPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedSession = readStorage<AdminSession>(storageKeys.admin);
    setSession(savedSession);
    void loadSchools();
  }, []);

  async function loadSchools() {
    try {
      setSchools(await listSchools());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load schools.");
    }
  }

  async function changeStatus(schoolId: string, status: "VERIFIED" | "REJECTED" | "SUSPENDED") {
    if (!session) return;
    setError("");
    try {
      await updateSchoolStatus(session.token, schoolId, status);
      await loadSchools();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update school.");
    }
  }

  return (
    <SidebarLayout title="School verification" role="Admin dashboard" links={links}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold uppercase text-indigo-700">Partner onboarding</p><h2 className="mt-1 text-3xl font-black">Review and activate schools</h2></div>
        <Button onClick={() => void loadSchools()} variant="ghost">Refresh</Button>
      </div>
      {!session ? <Card className="mb-4"><p className="font-semibold text-slate-700">Admin login is required to change verification status.</p><Button href="/admin/login" className="mt-4">Admin login</Button></Card> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <div className="grid gap-4">
        {schools.map((school) => (
          <Card key={school.id} className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <StatusBadge status={school.verificationStatus} />
              <h2 className="mt-3 text-xl font-black">{school.name}</h2>
              <p className="text-sm text-slate-500">{school.ownerName} - {school.ownerMobile} - {school.city}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{school.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={!session} onClick={() => void changeStatus(school.id, "VERIFIED")} variant="secondary">Verify</Button>
              <Button disabled={!session} onClick={() => void changeStatus(school.id, "REJECTED")} variant="ghost">Reject</Button>
              <Button disabled={!session} onClick={() => void changeStatus(school.id, "SUSPENDED")} variant="dark">Suspend</Button>
            </div>
          </Card>
        ))}
      </div>
    </SidebarLayout>
  );
}
