"use client";

import { useEffect, useState } from "react";
import { Button, Card, StatusBadge } from "../../components/ui";
import { readStorage, storageKeys, type Booking } from "../../lib/local-api";

export default function PaymentSuccessPage() {
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setBooking(readStorage<Booking>(storageKeys.lastBooking));
  }, []);

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-3xl place-items-center px-4 py-10">
      <Card className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-xl font-black text-green-700">OK</div>
        <h1 className="mt-5 text-4xl font-black">Booking sent to the school</h1>
        <p className="mt-3 text-slate-600">Payment is recorded. The partner can now accept your requested slot from their own site.</p>
        <div className="mt-5"><StatusBadge status={booking?.status ?? "WAITING_FOR_SCHOOL_ACCEPTANCE"} /></div>
        {booking ? (
          <p className="mt-4 text-sm font-semibold text-slate-600">{booking.courseTitle} at {booking.schoolName} - {booking.preferredStartDate}, {booking.preferredTimeSlot}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/dashboard">Track booking</Button>
          <Button href="/schools" variant="ghost">Explore more</Button>
        </div>
      </Card>
    </main>
  );
}
