import { Card } from "@/components/ui";

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Card>
        <h1 className="text-3xl font-black text-slate-950">Refund Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: June 2026</p>

        <div className="mt-6 space-y-5 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-slate-950">1. Before School Acceptance</h2>
            <p className="mt-2">
              If the booking is not accepted by the driving school, the customer may be eligible for a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">2. After School Acceptance</h2>
            <p className="mt-2">
              If the customer cancels after the driving school accepts the booking but before classes start, refund approval
              may depend on the driving school policy and administrative costs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">3. After Classes Start</h2>
            <p className="mt-2">
              Once training sessions have started, refunds may not be available except in special cases approved by admin.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">4. Failed Payments</h2>
            <p className="mt-2">
              If money is deducted but payment is not confirmed, the customer should contact support with payment details.
              Refund or reconciliation will depend on payment gateway confirmation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">5. Refund Timeline</h2>
            <p className="mt-2">
              Approved refunds may take 5–10 working days depending on the bank or payment provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">6. Contact</h2>
            <p className="mt-2">
              For refund support, contact: support@driveconnect.in
            </p>
          </section>
        </div>
      </Card>
    </main>
  );
}