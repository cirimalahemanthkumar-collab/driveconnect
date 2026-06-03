import { Button, Card, Input, Select, StatusBadge } from "../../components/ui";
import { complaints } from "../../lib/mock";

export default function SupportPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_1fr]">
      <section>
        <p className="text-sm font-bold uppercase text-blue-600">Support</p>
        <h1 className="mt-1 text-4xl font-black">Raise a complaint or refund request</h1>
        <Card className="mt-6 space-y-4">
          <Select defaultValue="booking-101"><option>Metro Gear - Four Wheeler Beginner Pack</option></Select>
          <Input placeholder="Subject" defaultValue="Need help rescheduling a session" />
          <textarea className="focus-ring min-h-32 w-full rounded-lg border border-slate-200 p-4 text-sm shadow-sm" defaultValue="Please help coordinate a new class slot with the school." />
          <Button className="w-full">Create complaint</Button>
        </Card>
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-black">Recent tickets</h2>
        <div className="grid gap-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{complaint.id}</p>
                <h3 className="font-black">{complaint.subject}</h3>
                <p className="text-sm text-slate-500">{complaint.owner}</p>
              </div>
              <StatusBadge status={complaint.status} />
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
