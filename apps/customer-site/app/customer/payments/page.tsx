"use client";

import { Button, Card, StatusBadge } from "../../../components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, dateText, money, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

export default function CustomerPaymentsPage() {
  const paymentsResource = useApiResource<unknown>(API_ENDPOINTS.customer.payments, []);
  const bookingsResource = useApiResource<unknown>(API_ENDPOINTS.customer.bookings, []);
  const paymentRecords = paymentsResource.error ? [] : asList(paymentsResource.data, ["payments", "items"]);
  const bookingSummaries = asList(bookingsResource.data, ["bookings", "items"]).map(toBookingPaymentSummary);
  const payments = paymentRecords.length ? paymentRecords : bookingSummaries;
  const loading = paymentsResource.loading || (!paymentRecords.length && bookingsResource.loading);
  const blockingError = bookingsResource.error && !paymentRecords.length;

  if (loading) return <LoadingState label="Loading your payment history..." />;

  return (
    <div>
      <PageIntro
        eyebrow="Customer payments"
        title="My payments"
        description="Review payment status, transaction references, and booking amounts."
        action={<Button variant="ghost" onClick={() => { void paymentsResource.reload(); void bookingsResource.reload(); }}>Refresh</Button>}
      />
      {blockingError ? <ErrorBanner message={bookingsResource.error} retry={() => { void paymentsResource.reload(); void bookingsResource.reload(); }} /> : null}
      {paymentsResource.error && !blockingError ? (
        <Card className="mt-5 bg-amber-50/80 text-sm font-semibold text-amber-800 ring-amber-100">
          Payment records are temporarily unavailable, so booking payment summaries are shown instead.
        </Card>
      ) : null}
      <TableCard columns={["School", "Course", "Amount", "Advance", "Payment status", "Booking status", "Created"]} empty={!payments.length}>
        {payments.map((payment, index) => (
          <tr key={`${readPaymentId(payment)}-${index}`} className="text-slate-700">
            <td className="px-4 py-4">{readValue(payment, "school_name", "schoolName")}</td>
            <td className="px-4 py-4">{readValue(payment, "course_name", "courseName")}</td>
            <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-950">{money(readValue(payment, "amount", "total_amount", "totalAmount"))}</td>
            <td className="whitespace-nowrap px-4 py-4">{money(readValue(payment, "advance_amount", "advanceAmount"))}</td>
            <td className="whitespace-nowrap px-4 py-4">
              <StatusBadge status={readValue(payment, "payment_status", "paymentStatus", "status")} />
            </td>
            <td className="whitespace-nowrap px-4 py-4"><StatusBadge status={readValue(payment, "booking_status", "bookingStatus")} /></td>
            <td className="whitespace-nowrap px-4 py-4">{dateText(readValue(payment, "created_at", "createdAt"))}</td>
          </tr>
        ))}
      </TableCard>
    </div>
  );
}

function readPaymentId(payment: ApiRecord) {
  return firstText(readValue(payment, "payment_id", "paymentId", "id", "_id"), readValue(payment, "booking_id", "bookingId"));
}

function toBookingPaymentSummary(booking: ApiRecord): ApiRecord {
  const bookingStatus = readValue(booking, "booking_status", "bookingStatus", "status");

  return {
    id: readValue(booking, "booking_id", "bookingId", "id", "_id"),
    booking_id: readValue(booking, "booking_id", "bookingId", "id", "_id"),
    school_name: readValue(booking, "school_name", "schoolName"),
    course_name: readValue(booking, "course_name", "courseName"),
    amount: readValue(booking, "amount", "total_amount", "totalAmount", "price"),
    advance_amount: readValue(booking, "advance_amount", "advanceAmount"),
    payment_status: ["ACCEPTED", "CONFIRMED", "ONGOING", "COMPLETED"].includes(bookingStatus.toUpperCase()) ? "PENDING" : "UNPAID",
    booking_status: bookingStatus,
    created_at: readValue(booking, "created_at", "createdAt"),
  };
}

function readValue(record: ApiRecord, ...keys: string[]) {
  const value = text(record, ...keys);
  return value === "-" ? "" : value;
}

function firstText(...values: string[]) {
  return values.map((value) => value.trim()).find(Boolean) || "-";
}

function shortId(value: string) {
  if (!value || value === "-") return "-";
  return value.length > 12 ? `${value.slice(0, 10)}...` : value;
}
