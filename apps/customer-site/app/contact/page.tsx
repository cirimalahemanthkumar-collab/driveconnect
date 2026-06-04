import { Card, Button } from "@/components/ui";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Card>
        <h1 className="text-3xl font-black text-slate-950">Contact DriveConnect</h1>
        <p className="mt-3 text-slate-600">
          For support, school onboarding, complaints, payments, or partnership queries, contact us.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-5">
            <h2 className="font-bold text-slate-950">Support Email</h2>
            <p className="mt-2 text-slate-700">support@driveconnect.in</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-5">
            <h2 className="font-bold text-slate-950">Business Email</h2>
            <p className="mt-2 text-slate-700">business@driveconnect.in</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-5">
            <h2 className="font-bold text-slate-950">Support Hours</h2>
            <p className="mt-2 text-slate-700">Monday to Saturday, 10:00 AM – 6:00 PM</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-5">
            <h2 className="font-bold text-slate-950">Location</h2>
            <p className="mt-2 text-slate-700">Andhra Pradesh, India</p>
          </div>
        </div>

        <div className="mt-6">
          <Button href="/customer/complaints">Raise a Complaint</Button>
        </div>
      </Card>
    </main>
  );
}