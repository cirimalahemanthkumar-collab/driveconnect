import { Card } from "@/components/ui";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Card>
        <h1 className="text-3xl font-black text-slate-950">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: June 2026</p>

        <div className="mt-6 space-y-5 text-slate-700">
          <p>
            DriveConnect is a driving school marketplace platform that connects customers with verified driving schools.
            This Privacy Policy explains what information we collect and how we use it.
          </p>

          <section>
            <h2 className="text-xl font-bold text-slate-950">1. Information We Collect</h2>
            <p className="mt-2">
              We may collect your name, email address, phone number, address, city, learner license details, emergency
              contact details, booking details, payment details, complaints, reviews, and account activity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">2. How We Use Your Information</h2>
            <p className="mt-2">
              We use your information to create your account, manage bookings, connect you with driving schools,
              process payments, schedule sessions, provide customer support, send notifications, prevent misuse, and improve
              our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">3. Sharing of Information</h2>
            <p className="mt-2">
              Customer booking information may be shared with the selected driving school for training and communication.
              We do not sell personal data. Payment information may be processed through trusted payment partners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">4. Data Security</h2>
            <p className="mt-2">
              We use reasonable technical and organizational measures to protect your data. However, no online system can
              be guaranteed to be completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">5. User Rights</h2>
            <p className="mt-2">
              You may contact us to request access, correction, or deletion of your personal data, subject to legal and
              operational requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">6. Contact</h2>
            <p className="mt-2">
              For privacy-related requests, contact us at: support@driveconnect.in
            </p>
          </section>
        </div>
      </Card>
    </main>
  );
}