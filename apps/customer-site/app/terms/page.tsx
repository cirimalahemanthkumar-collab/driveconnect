import { Card } from "@/components/ui";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Card>
        <h1 className="text-3xl font-black text-slate-950">Terms and Conditions</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: June 2026</p>

        <div className="mt-6 space-y-5 text-slate-700">
          <p>
            By using DriveConnect, you agree to these Terms and Conditions.
          </p>

          <section>
            <h2 className="text-xl font-bold text-slate-950">1. Platform Role</h2>
            <p className="mt-2">
              DriveConnect acts as a technology platform connecting customers with driving schools. Training services are
              provided by the respective driving school.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">2. Customer Responsibilities</h2>
            <p className="mt-2">
              Customers must provide accurate details, attend sessions on time, follow instructor guidance, and comply with
              traffic and safety rules.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">3. Driving School Responsibilities</h2>
            <p className="mt-2">
              Driving schools must provide valid documents, qualified instructors, safe vehicles, accurate course details,
              and professional training services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">4. Bookings and Payments</h2>
            <p className="mt-2">
              Bookings are confirmed based on driving school acceptance and successful payment. Prices may vary by school,
              course, vehicle type, location, and availability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">5. Limitation of Liability</h2>
            <p className="mt-2">
              DriveConnect is not responsible for accidents, misconduct, delays, or service quality issues caused directly
              by customers or partner driving schools. However, we will support complaint resolution through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">6. Account Suspension</h2>
            <p className="mt-2">
              We may suspend accounts or schools that provide false information, misuse the platform, or violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">7. Contact</h2>
            <p className="mt-2">For support, contact: support@driveconnect.in</p>
          </section>
        </div>
      </Card>
    </main>
  );
}