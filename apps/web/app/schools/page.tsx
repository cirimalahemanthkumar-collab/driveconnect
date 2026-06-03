import { Button, Card, Input, SchoolCard, Select } from "../../components/ui";
import { schools } from "../../lib/mock";

export default function SchoolsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-blue-600">Nearby schools</p>
          <h1 className="mt-1 text-4xl font-black">Ranked by verification, distance, rating, and availability</h1>
        </div>
        <Button href="/checkout" variant="secondary">Quick book</Button>
      </div>

      <Card className="mt-6">
        <div className="grid gap-3 md:grid-cols-6">
          <Input className="md:col-span-2" placeholder="Location" defaultValue="12.97, 77.59" />
          <Select defaultValue="FOUR_WHEELER"><option>FOUR_WHEELER</option><option>TWO_WHEELER</option><option>BOTH</option></Select>
          <Select defaultValue="BEGINNER"><option>BEGINNER</option><option>ADVANCED</option><option>REFRESHER</option></Select>
          <Select defaultValue="4"><option value="4">4+ rating</option><option value="3">3+ rating</option></Select>
          <Button variant="dark">Apply</Button>
        </div>
      </Card>

      <section className="mt-6 grid gap-5 md:grid-cols-2">
        {schools.map((school) => (
          <SchoolCard key={school.id} school={school} />
        ))}
      </section>
    </main>
  );
}
