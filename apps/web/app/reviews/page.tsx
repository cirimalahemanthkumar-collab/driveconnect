import { Button, Card, Input, Select } from "../../components/ui";

export default function ReviewsPage() {
  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-[0.8fr_1.2fr]">
      <section>
        <p className="text-sm font-bold uppercase text-blue-600">Reviews</p>
        <h1 className="mt-1 text-4xl font-black">Rate your school and instructor</h1>
        <p className="mt-4 text-slate-600">Ratings improve marketplace ranking and help the platform monitor service quality.</p>
      </section>
      <Card className="space-y-4">
        <Select defaultValue="booking-103"><option value="booking-103">BlueLane - Advanced City Driving</option></Select>
        <Select defaultValue="5"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option></Select>
        <Select defaultValue="5"><option value="5">Instructor 5 stars</option><option value="4">Instructor 4 stars</option></Select>
        <Input placeholder="Review comment" defaultValue="Clear lessons and helpful progress notes" />
        <Button className="w-full">Submit review</Button>
      </Card>
    </main>
  );
}
