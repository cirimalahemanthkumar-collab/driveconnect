"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Input, Select, StatusBadge } from "../../../components/ui";
import { registerPartner, storageKeys, writeStorage, type PartnerSession } from "../../../lib/local-api";

export default function PartnerRegisterPage() {
  const [form, setForm] = useState({
    ownerName: "Priya Rao",
    ownerMobile: "+919870000099",
    ownerPin: "1234",
    name: "PrimeWheel Motor Training",
    description: "Patient instructors, clean vehicles, and practical city-route lessons.",
    phone: "+919870000099",
    address: "Hebbal Kempapura, Bengaluru",
    city: "Bengaluru",
    latitude: "13.0358",
    longitude: "77.5970",
    pickupAvailable: "true",
    femaleInstructorAvailable: "true"
  });
  const [session, setSession] = useState<PartnerSession | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function setValue(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const nextSession = await registerPartner({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        pickupAvailable: form.pickupAvailable === "true",
        femaleInstructorAvailable: form.femaleInstructorAvailable === "true"
      });
      writeStorage(storageKeys.partner, nextSession);
      setSession(nextSession);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to register school.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.85fr_1.15fr]">
      <section>
        <p className="text-sm font-bold uppercase text-green-700">Partner onboarding</p>
        <h1 className="mt-1 text-4xl font-black">Register your school for admin verification</h1>
        <p className="mt-4 leading-7 text-slate-600">Create the partner account first. The DriveConnect admin verifies the listing, then customers can book your courses and your team can confirm slots from the booking queue.</p>
        {session ? (
          <Card className="mt-6 space-y-3 border-green-200 bg-green-50/90">
            <StatusBadge status={session.school.verificationStatus} />
            <h2 className="text-xl font-black">{session.school.name} is registered</h2>
            <p className="text-sm leading-6 text-slate-600">The account is ready. Ask the admin to verify the school before taking customer bookings.</p>
            <Button href="/partner/dashboard">Open partner dashboard</Button>
          </Card>
        ) : null}
      </section>
      <form onSubmit={submit}>
        <Card className="grid gap-4">
          <Input required placeholder="Owner name" value={form.ownerName} onChange={(event) => setValue("ownerName", event.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input required placeholder="Owner mobile" value={form.ownerMobile} onChange={(event) => setValue("ownerMobile", event.target.value)} />
            <Input required type="password" placeholder="Create PIN" value={form.ownerPin} onChange={(event) => setValue("ownerPin", event.target.value)} />
          </div>
          <Input required placeholder="School name" value={form.name} onChange={(event) => setValue("name", event.target.value)} />
          <Input required placeholder="Business description" value={form.description} onChange={(event) => setValue("description", event.target.value)} />
          <Input required placeholder="Business phone" value={form.phone} onChange={(event) => setValue("phone", event.target.value)} />
          <Input required placeholder="Business address" value={form.address} onChange={(event) => setValue("address", event.target.value)} />
          <Input required placeholder="City" value={form.city} onChange={(event) => setValue("city", event.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input required placeholder="Latitude" value={form.latitude} onChange={(event) => setValue("latitude", event.target.value)} />
            <Input required placeholder="Longitude" value={form.longitude} onChange={(event) => setValue("longitude", event.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select value={form.pickupAvailable} onChange={(event) => setValue("pickupAvailable", event.target.value)}>
              <option value="true">Doorstep pickup available</option>
              <option value="false">No pickup</option>
            </Select>
            <Select value={form.femaleInstructorAvailable} onChange={(event) => setValue("femaleInstructorAvailable", event.target.value)}>
              <option value="true">Female instructor available</option>
              <option value="false">No female instructor</option>
            </Select>
          </div>
          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Registering..." : "Submit for review"}</Button>
          <Button href="/partner/login" variant="ghost" className="w-full">Already registered? Log in</Button>
        </Card>
      </form>
    </main>
  );
}
