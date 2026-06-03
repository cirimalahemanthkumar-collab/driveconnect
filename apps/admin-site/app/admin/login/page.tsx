"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getStoredNotice, useAuth } from "../../../components/auth-context";
import { Alert, Badge, Button, Card, Input } from "../../../components/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setError(getStoredNotice());
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace("/admin/dashboard");
  }, [loading, router, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login({ email, password });
      router.replace("/admin/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-5xl items-center gap-6 px-4 py-10 lg:grid-cols-[1fr_430px]">
      <section className="rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-800 to-blue-500 p-8 text-white shadow-soft">
        <Badge tone="indigo">Separate admin site</Badge>
        <h1 className="mt-5 text-4xl font-black leading-tight">Marketplace operations, in one focused workspace.</h1>
        <p className="mt-4 leading-7 text-blue-50">Use your authorized admin account to monitor the platform and manage partner operations.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {["School approvals", "Document review", "Complaint resolution", "Payout processing"].map((item) => (
            <div key={item} className="rounded-lg bg-white/10 p-3 text-sm font-bold ring-1 ring-white/15">{item}</div>
          ))}
        </div>
      </section>
      <Card className="space-y-4">
        <p className="text-sm font-bold uppercase tracking-wide text-indigo-700">Admin login</p>
        <h2 className="text-3xl font-black text-slate-950">Welcome back</h2>
        <p className="text-sm leading-6 text-slate-500">Only ADMIN, SUPER_ADMIN, SUPPORT_STAFF, and ACCOUNTANT roles can use this site.</p>
        {error ? <Alert>{error}</Alert> : null}
        <form className="grid gap-4" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Email
            <Input required type="email" autoComplete="email" placeholder="admin@driveconnect.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Password
            <Input required type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <Button type="submit" disabled={submitting || loading} className="w-full">
            {submitting ? "Signing in..." : "Sign in to admin site"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
