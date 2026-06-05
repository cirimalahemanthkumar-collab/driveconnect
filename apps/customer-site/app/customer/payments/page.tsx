"use client";

import { Button, StatusBadge } from "../../../components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, dateText, money, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

export default function CustomerPaymentsPage() {
  const resource = useApiResource<unknown>(API_ENDPOINTS.customer.payments, []);
  const payments = asList(resource.data, ["payments", "items"]);

  if (resource.loading) return <LoadingState label="Loading your payment history..." />;

  return (
    <div>
      <PageIntro
        eyebrow="Customer payments"
        title="My payments"
        description="Review payment status, transaction references, and booking amounts."
        action={<Button variant="ghost" onClick={() => void resource.reload()}>Refresh</Button>}
      />
      {resource.error ? <ErrorBanner message={resource.error} retry={() => void resource.reload()} /> : null}
      <TableCard columns={["Payment", "School", "Course", "Amount", "Advance", "Status", "Method", "Created"]} empty={!payments.length}>
        {payments.map((payment, index) => (
          <tr key={`${readPaymentId(payment)}-${index}`} className="text-slate-700">
            <td className="whitespace-nowrap px-4 py-4">
              <p className="font-semibold text-slate-950">{shortId(readPaymentId(payment))}</p>
              <p className="mt-1 text-xs text-slate-500">{shortId(readValue(payment, "booking_id", "bookingId"))}</p>
            </td>
            <td className="px-4 py-4">{readValue(payment, "school_name", "schoolName")}</td>
            <td className="px-4 py-4">{readValue(payment, "course_name", "courseName")}</td>
            <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-950">{money(readValue(payment, "amount", "total_amount", "totalAmount"))}</td>
            <td className="whitespace-nowrap px-4 py-4">{money(readValue(payment, "advance_amount", "advanceAmount"))}</td>
            <td className="whitespace-nowrap px-4 py-4">
              <StatusBadge status={readValue(payment, "payment_status", "paymentStatus", "status")} />
              <p className="mt-1 text-xs text-slate-500">{readValue(payment, "booking_status", "bookingStatus")}</p>
            </td>
            <td className="px-4 py-4">
              <p>{readValue(payment, "payment_method", "paymentMethod")}</p>
              <p className="mt-1 text-xs text-slate-500">{shortId(readValue(payment, "transaction_reference", "transactionReference"))}</p>
            </td>
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
