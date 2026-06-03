"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Input, StatusBadge } from "../../../components/ui";
import { loginPartner, storageKeys, writeStorage, type PartnerSession } from "../../../lib/local-api";

export default function PartnerLoginPage() {
  const [mobile, setMobile] = useState("+919870000001");
  const [pin, setPin] = useState("1234");
  const [session, setSession] = useState<PartnerSession | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const nextSession = await loginPartner({ mobile, pin });
      writeStorage(storageKeys.partner, nextSession);
      setSession(nextSession);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-4xl place-items-center px-4 py-10">
      <Card className="w-full max-w-md space-y-4">
        <p className="text-sm font-bold uppercase text-green-700">Partner login</p>
        <h1 className="text-3xl font-black">School operations</h1>
        {session ? (
          <>
            <StatusBadge status={session.school.verificationStatus} />
            <p className="text-sm font-semibold text-slate-600">Logged in as {session.school.name}</p>
            <Button href="/partner/dashboard" className="w-full">Open dashboard</Button>
          </>
        ) : (
          <form className="grid gap-4" onSubmit={submit}>
            <Input required placeholder="Owner mobile" value={mobile} onChange={(event) => setMobile(event.target.value)} />
            <Input required type="password" placeholder="PIN" value={pin} onChange={(event) => setPin(event.target.value)} />
            {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
            <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Logging in..." : "Log in"}</Button>
            <Button href="/partner/register" variant="ghost" className="w-full">Register a new school</Button>
          </form>
        )}
      </Card>
    </main>
  );
}
