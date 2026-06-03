import { Badge, Button, Card, StatCard } from "../components/ui";

export default function AdminHomePage() {
  return (
    <main>
      <section className="bg-gradient-to-br from-slate-950 via-indigo-800 to-blue-500 text-white">
        <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl items-center gap-8 px-4 py-12 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <Badge tone="indigo">Private operations console</Badge>
            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">DriveConnect Admin</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">
              A focused workspace for marketplace oversight, partner approvals, document checks, payouts, complaints, and platform notifications.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/admin/login" variant="secondary">Admin login</Button>
              <Button href="/admin/dashboard" variant="ghost">Open console</Button>
            </div>
          </div>
          <Card className="bg-white/95">
            <h2 className="text-2xl font-black text-slate-950">Operations at a glance</h2>
            <div className="mt-5 grid gap-3">
              {["Approve and monitor schools", "Verify partner documents", "Resolve complaints quickly", "Process payouts and send updates"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-indigo-50 p-4">
                  <span className="grid size-8 place-items-center rounded-full bg-indigo-700 text-sm font-black text-white">{index + 1}</span>
                  <span className="font-semibold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 md:grid-cols-4">
        <StatCard label="Partner checks" value="Fast" detail="Schools and documents" tone="blue" />
        <StatCard label="Operations" value="Live" detail="Complaints and payouts" tone="green" />
        <StatCard label="Access" value="Role based" detail="Admin staff only" tone="indigo" />
        <StatCard label="Updates" value="Direct" detail="Admin notifications" tone="amber" />
      </section>
    </main>
  );
}
