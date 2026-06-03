import { BookingTimeline, Button, Card, StatusBadge } from "../../../components/ui";
import { bookings, timeline } from "../../../lib/mock";

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = bookings.find((item) => item.id === id) ?? bookings[0];

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <section>
        <StatusBadge status={booking.status} />
        <h1 className="mt-4 text-4xl font-black">{booking.course}</h1>
        <p className="mt-2 text-slate-600">{booking.school}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card><p className="text-sm text-slate-500">Instructor</p><p className="mt-2 font-black">{booking.instructor}</p></Card>
          <Card><p className="text-sm text-slate-500">Next class</p><p className="mt-2 font-black">{booking.nextClass}</p></Card>
          <Card><p className="text-sm text-slate-500">Amount</p><p className="mt-2 font-black">Rs {booking.amount}</p></Card>
        </div>
        <Card className="mt-6">
          <h2 className="mb-5 text-2xl font-black">Class sessions</h2>
          <div className="grid gap-3">
            {["Orientation", "Traffic basics", "Parking practice", "Road confidence"].map((session, index) => (
              <div key={session} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <span className="font-semibold">{session}</span>
                <StatusBadge status={index < 2 ? "CLASS_COMPLETED" : "CLASS_SCHEDULED"} />
              </div>
            ))}
          </div>
        </Card>
      </section>
      <aside className="space-y-4">
        <Card>
          <h2 className="mb-5 text-2xl font-black">Booking status</h2>
          <BookingTimeline steps={timeline} />
        </Card>
        <Button href="/reviews" className="w-full">Rate experience</Button>
        <Button href="/support" variant="ghost" className="w-full">Contact support</Button>
      </aside>
    </main>
  );
}
