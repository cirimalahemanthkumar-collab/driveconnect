"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "../../components/auth-provider";
import { Field, FormError } from "../../components/portal-ui";
import { getApiErrorMessage } from "../../lib/api";

type Role = "CUSTOMER" | "SCHOOL_OWNER";

export default function RegisterPage() {
  const { register } = useAuth();
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", schoolName: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
await register({
  full_name: form.name.trim(),
  email: form.email.trim().toLowerCase(),
  phone: form.phone.trim(),
  password: form.password,
  role,
  school_name: role === "SCHOOL_OWNER" ? form.schoolName.trim() : undefined
} as any);    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to create the account."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[0.85fr_1.15fr]">
      <section>
        <p className="text-sm font-bold uppercase text-green-700">Join DriveConnect</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Start as a learner or grow as a school partner.</h1>
        <p className="mt-4 max-w-xl leading-7 text-slate-600">Both experiences share one trusted marketplace while keeping daily workflows focused.</p>
      </section>
      <Card>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <button type="button" className={`rounded-lg px-3 py-2 text-sm font-bold ${role === "CUSTOMER" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`} onClick={() => setRole("CUSTOMER")}>Customer</button>
            <button type="button" className={`rounded-lg px-3 py-2 text-sm font-bold ${role === "SCHOOL_OWNER" ? "bg-white text-green-700 shadow-sm" : "text-slate-600"}`} onClick={() => setRole("SCHOOL_OWNER")}>School owner</button>
          </div>
          <Field label="Full name"><Input value={form.name} onChange={(event) => update("name", event.target.value)} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email"><Input value={form.email} onChange={(event) => update("email", event.target.value)} type="email" required /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(event) => update("phone", event.target.value)} type="tel" required /></Field>
          </div>
          {role === "SCHOOL_OWNER" ? <Field label="Driving school name"><Input value={form.schoolName} onChange={(event) => update("schoolName", event.target.value)} required /></Field> : null}
          <Field label="Password"><Input value={form.password} onChange={(event) => update("password", event.target.value)} type="password" minLength={6} required /></Field>
          <FormError message={error} />
          <Button type="submit" variant={role === "CUSTOMER" ? "primary" : "secondary"} disabled={submitting}>{submitting ? "Creating account..." : "Create account"}</Button>
          <p className="text-center text-sm text-slate-600">Already registered? <Link href="/login" className="font-bold text-blue-700">Login</Link></p>
        </form>
      </Card>
    </main>
  );
}

