"use client";

import { Button, DashboardStatCard, StatusBadge } from "../../../components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, asRecord, dateText, money, text } from "../../../lib/records";
import { ErrorBanner, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

export default function PartnerPayoutsPage() {
  const summaryResource = useApiResource<unknown>(API_ENDPOINTS.partner.payoutSummary, {});
  const payoutsResource = useApiResource<unknown>(API_ENDPOINTS.partner.payouts, []);
  const summary = asRecord(summaryResource.data);
  const payouts = asList(payoutsResource.data, ["payouts", "items"]);
  const error = summaryResource.error || payoutsResource.error;

  if (summaryResource.loading || payoutsResource.loading) return <LoadingState label="Loading payout summary..." />;

  return (
    <div>
      <PageIntro eyebrow="Partner finance" title="Payouts" description="Track gross earnings, pending settlement, and payout history." action={<Button variant="ghost" onClick={() => { void summaryResource.reload(); void payoutsResource.reload(); }}>Refresh</Button>} />
      {error ? <ErrorBanner message={error} /> : null}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <DashboardStatCard label="Gross earnings" value={money(summary.grossEarnings ?? summary.totalEarnings)} delta="Total" tone="blue" />
        <DashboardStatCard label="Pending payout" value={money(summary.pendingPayout)} delta="Pending" tone="amber" />
        <DashboardStatCard label="Paid out" value={money(summary.paidOut ?? summary.totalPaid)} delta="Settled" tone="green" />
      </section>
      <TableCard columns={["Payout", "Amount", "Status", "Created"]} empty={!payouts.length}>
        {payouts.map((payout, index) => (
          <tr key={text(payout, "id", "_id") + index}>
            <td className="px-4 py-4 font-semibold text-slate-950">{text(payout, "id", "_id")}</td>
            <td className="px-4 py-4 font-bold text-slate-950">{money(payout.amount)}</td>
            <td className="px-4 py-4"><StatusBadge status={text(payout, "status")} /></td>
            <td className="px-4 py-4 text-slate-700">{dateText(payout.createdAt ?? payout.paidAt)}</td>
          </tr>
        ))}
      </TableCard>
    </div>
  );
}

