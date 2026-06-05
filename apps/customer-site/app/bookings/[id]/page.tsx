import { redirect } from "next/navigation";

export default function BookingDetailsPage() {
  redirect(`/login?redirect=${encodeURIComponent("/customer/bookings")}`);
}
