"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Input } from "../../../components/ui";
import { getBootstrap, loginAdmin, setupAdmin, storageKeys, writeStorage, type AdminSession } from "../../../lib/local-api";

export default function AdminLoginPage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [name, setName] = useState("DriveConnect Owner");
  const [mobile, setMobile] = useState("+919900000000");
  const [pin, setPin] = useState("1234");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getBootstrap()
      .then((bootstrap) => setConfigured(bootstrap.adminConfigured))
      .catch((requestError: Error) => setError(requestError.message));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const nextSession = configured
        ? await loginAdmin({ mobile, pin })
        : await setupAdmin({ name, mobile, pin });
      writeStorage(storageKeys.admin, nextSession);
      setSession(nextSession);
      setConfigured(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to access admin console.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-4xl place-items-center px-4 py-10">
      <Card className="w-full max-w-md space-y-4">
        <p className="text-sm font-bold uppercase text-indigo-700">{configured ? "Admin login" : "First-time admin setup"}</p>
        <h1 className="text-3xl font-black">{configured ? "Platform console" : "Create the owner account"}</h1>
        {session ? (
          <>
            <p className="text-sm font-semibold text-green-700">Signed in as {session.name}</p>
            <Button href="/admin/dashboard" className="w-full">Open admin dashboard</Button>
          </>
        ) : (
          <form className="grid gap-4" onSubmit={submit}>
            {!configured ? <Input required placeholder="Admin name" value={name} onChange={(event) => setName(event.target.value)} /> : null}
            <Input required placeholder="Admin mobile" value={mobile} onChange={(event) => setMobile(event.target.value)} />
            <Input required type="password" placeholder="PIN" value={pin} onChange={(event) => setPin(event.target.value)} />
            {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
            <Button type="submit" disabled={submitting || configured === null} className="w-full">
              {submitting ? "Please wait..." : configured ? "Log in" : "Create admin account"}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
