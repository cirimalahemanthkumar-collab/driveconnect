import { Badge, Button, Card, Input, SchoolCard, Select } from "../../components/ui";
import { schools } from "../../lib/mock";

export default function CustomerHomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="rounded-lg bg-gradient-to-r from-blue-600 via-cyan-500 to-green-400 p-6 text-white shadow-soft">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase text-amber-100">Good evening, Learner</p>
          <h1 className="mt-2 text-4xl font-black">Book your next driving class with confidence</h1>
          <p className="mt-3 text-blue-50">Compare verified schools, choose slots, and track class progress from your dashboard.</p>
        </div>
      </section>

      <Card className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1.4fr_repeat(4,1fr)_auto]">
          <Input placeholder="Search area or school" defaultValue="Indiranagar" />
          <Select defaultValue="FOUR_WHEELER">
            <option value="FOUR_WHEELER">Four wheeler</option>
            <option value="TWO_WHEELER">Two wheeler</option>
            <option value="BOTH">Both</option>
          </Select>
          <Select defaultValue="BEGINNER">
            <option value="BEGINNER">Beginner</option>
            <option value="ADVANCED">Advanced</option>
            <option value="REFRESHER">Refresher</option>
          </Select>
          <Select defaultValue="female">
            <option value="any">Any instructor</option>
            <option value="female">Female option</option>
          </Select>
          <Select defaultValue="pickup">
            <option value="pickup">Pickup</option>
            <option value="self">Self visit</option>
          </Select>
          <Button href="/schools" variant="dark">Search</Button>
        </div>
      </Card>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5 md:grid-cols-2">
          {schools.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
        <aside className="space-y-4">
          <Card>
            <p className="text-sm font-bold uppercase text-green-700">Current booking</p>
            <h2 className="mt-2 text-2xl font-black">Course in progress</h2>
            <p className="mt-2 text-sm text-slate-600">Next class today at 6:00 PM with Ananya Sharma.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="green">3 of 15 sessions</Badge>
              <Badge tone="blue">Pickup enabled</Badge>
            </div>
            <Button href="/dashboard" className="mt-5 w-full">Open dashboard</Button>
          </Card>
          <Card>
            <p className="text-sm font-bold uppercase text-amber-700">Licence guidance</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Get process reminders and document checklist support from your selected school. Licence approval remains with the issuing authority.</p>
          </Card>
        </aside>
      </section>
    </main>
  );
}
