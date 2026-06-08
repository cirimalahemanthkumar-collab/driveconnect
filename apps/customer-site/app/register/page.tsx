"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Card, Input } from "../../components/ui";
import { useAuth } from "../../components/auth-provider";
import { Field, FormError } from "../../components/portal-ui";
import { getApiErrorMessage } from "../../lib/api";

type Role = "CUSTOMER" | "SCHOOL_OWNER";
type Step = "form" | "otp";

export default function RegisterPage() {
  const { startRegistration, verifyRegistration, resendRegistrationOtp } = useAuth();
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", schoolName: "" });
  const [step, setStep] = useState<Step>("form");
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [redirectPath, setRedirectPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setRedirectPath(new URLSearchParams(window.location.search).get("redirect") || "");
  }, []);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const loginHref = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : "/login";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const result = await startRegistration({ ...form, role, schoolName: role === "SCHOOL_OWNER" ? form.schoolName : undefined });
      setOtpEmail(result.email);
      setOtp("");
      setStep("otp");
      setNotice("We sent a 6-digit OTP to your email.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to create the account."));
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await verifyRegistration({ email: otpEmail, otp });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Invalid OTP"));
    } finally {
      setSubmitting(false);
    }
  }

  async function resendOtp() {
    setResending(true);
    setError("");
    setNotice("");
    try {
      const result = await resendRegistrationOtp(otpEmail);
      setOtp("");
      setNotice(result.message || "OTP resent to your email.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to send OTP. Please try again."));
    } finally {
      setResending(false);
    }
  }

  function backToForm() {
    setStep("form");
    setOtp("");
    setNotice("");
    setError("");
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[0.85fr_1.15fr]">
      <section>
        <p className="text-sm font-bold uppercase text-green-700">Join DriveConnect</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Start as a learner or grow as a school partner.</h1>
        <p className="mt-4 max-w-xl leading-7 text-slate-600">Both experiences share one trusted marketplace while keeping daily workflows focused.</p>
      </section>
      <Card>
        {step === "form" ? (
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
            <Button type="submit" variant={role === "CUSTOMER" ? "primary" : "secondary"} disabled={submitting}>{submitting ? "Sending OTP..." : "Create account"}</Button>
            <p className="text-center text-sm text-slate-600">Already registered? <Link href={loginHref} className="font-bold text-blue-700">Login</Link></p>
          </form>
        ) : (
          <form className="grid gap-4" onSubmit={verifyOtp}>
            <div>
              <p className="text-sm font-bold uppercase text-blue-600">Email verification</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Enter your OTP</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">We sent a 6-digit OTP to your email.</p>
              <p className="mt-1 break-words text-sm font-bold text-slate-900">{otpEmail}</p>
            </div>
            {notice ? <p className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">{notice}</p> : null}
            <Field label="OTP">
              <Input
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                minLength={6}
                maxLength={6}
                required
              />
            </Field>
            <FormError message={error} />
            <Button type="submit" disabled={submitting || otp.length !== 6}>{submitting ? "Verifying..." : "Verify OTP"}</Button>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="ghost" onClick={resendOtp} disabled={resending || submitting}>{resending ? "Resending..." : "Resend OTP"}</Button>
              <Button type="button" variant="ghost" onClick={backToForm} disabled={submitting}>Change email</Button>
            </div>
          </form>
        )}
      </Card>
    </main>
  );
}
