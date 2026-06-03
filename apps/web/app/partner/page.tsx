import { Badge, Button, Card, DashboardStatCard } from "../../components/ui";
import { partnerStats } from "../../lib/mock";

export default function PartnerSitePage() {
  return (
    <main>
      <section className="bg-gradient-to-br from-green-700 via-emerald-500 to-amber-300 text-white">
        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-8 px-4 py-12 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <Badge tone="amber">Driving school owner portal</Badge>
            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">DriveConnect Partner</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-green-50">
              Manage school verification, course packages, instructors, vehicles, learner bookings, class schedules, reviews, complaints, and settlements in a dedicated partner workspace.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/partner/register" variant="secondary">Register school</Button>
              <Button href="/partner/dashboard" variant="ghost">Open dashboard</Button>
            </div>
          </div>
          <Card className="bg-white/95">
            <h2 className="text-2xl font-black text-slate-950">Partner workflow</h2>
            <div className="mt-5 grid gap-3">
              {["Submit business documents", "Publish learner-friendly courses", "Accept bookings and assign instructors", "Track payouts after commission"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                  <span className="grid size-8 place-items-center rounded-full bg-green-600 text-sm font-black text-white">{index + 1}</span>
                  <span className="font-semibold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 md:grid-cols-4">
        {partnerStats.map((stat) => (
          <DashboardStatCard key={stat.label} {...stat} />
        ))}
      </section>
    </main>
  );
}
