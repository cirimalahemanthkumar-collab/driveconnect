"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import { Alert, Button, Card, EmptyState, LoadingPanel, StatusBadge, formatCurrency, formatDate } from "../../../components/ui";
import { api, getApiError, readNumber, readText, unwrapList } from "../../../lib/api";

type Booking = {
  id?: string;
  _id?: string;
  booking_id?: string;
  customer_name?: string;
  customerName?: string;
  customer_email?: string;
  customerEmail?: string;
  school_name?: string;
  schoolName?: string;
  course_name?: string;
  courseName?: string;
  booking_status?: string;
  status?: string;
  total_amount?: number | string;
  totalAmount?: number | string;
  preferred_start_date?: string;
  requested_date?: string;
  createdAt?: string;
  created_at?: string;
};

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/admin/bookings");
      setBookings(unwrapList<Booking>(response.data, ["bookings"]));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load bookings."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  return (
    <AdminShell title="Bookings" eyebrow="Marketplace activity" actions={<Button onClick={() => void loadBookings()} variant="ghost">Refresh</Button>}>
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {loading ? <LoadingPanel label="Loading bookings..." /> : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-amber-600 to-orange-500 text-white">
                <tr>
                  <th className="px-5 py-4">Booking</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">School</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking, index) => (
                  <tr key={getBookingId(booking, index)} className="hover:bg-amber-50/50">
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-950">{readText(booking.course_name ?? booking.courseName, "Course booking")}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(booking.preferred_start_date ?? booking.requested_date)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{readText(booking.customer_name ?? booking.customerName, "Customer")}</p>
                      <p className="text-xs text-slate-500">{readText(booking.customer_email ?? booking.customerEmail)}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold">{readText(booking.school_name ?? booking.schoolName, "Driving school")}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold">{formatCurrency(readNumber(booking.total_amount ?? booking.totalAmount))}</td>
                    <td className="px-5 py-4"><StatusBadge status={booking.booking_status ?? booking.status} /></td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(booking.createdAt ?? booking.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!bookings.length ? <EmptyState>No bookings found.</EmptyState> : null}
        </Card>
      )}
    </AdminShell>
  );
}

function getBookingId(booking: Booking, index: number) {
  return String(booking.id ?? booking._id ?? booking.booking_id ?? index);
}
