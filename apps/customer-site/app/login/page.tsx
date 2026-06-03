"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Card, Input } from "../../../web/components/ui";
import { useAuth } from "../../components/auth-provider";
import { Field, FormError } from "../../components/portal-ui";
import { getApiErrorMessage } from "../../lib/api";

export default function LoginPage() {
  const { login, message } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const queryMessage = new URLSearchParams(window.location.search).get("message");
    if (queryMessage) setError(queryMessage);
    else if (message) setError(message);
  }, [message]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login({ email, password });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to login."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[0.9fr_1.1fr]">
      <section>
        <p className="text-sm font-bold uppercase text-blue-600">Customer and partner login</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">One account. The right workspace.</h1>
        <p className="mt-4 max-w-xl leading-7 text-slate-600">Learners go straight to their bookings. School owners arrive at partner operations. Admin team accounts stay in the separate Admin Site.</p>
      </section>
      <Card>
        <form className="grid gap-4" onSubmit={submit}>
          <Field label="Email">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="name@example.com" required />
          </Field>
          <Field label="Password">
            <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Enter your password" required />
          </Field>
          <FormError message={error} />
          <Button type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Login"}</Button>
          <p className="text-center text-sm text-slate-600">
            New to DriveConnect? <Link href="/register" className="font-bold text-blue-700">Create an account</Link>
          </p>
        </form>
      </Card>
    </main>
  );
}
