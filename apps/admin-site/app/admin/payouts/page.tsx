"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import { Alert, Button, Card, EmptyState, LoadingPanel, StatCard, StatusBadge, formatCurrency, formatDate } from "../../../components/ui";
import { api, getApiError, readNumber, readText, unwrapList } from "../../../lib/api";

type Payout = {
  id?: string;
  _id?: string;
  payoutId?: string;
  amount?: number | string;
  status?: string;
  createdAt?: string;
  paidAt?: string;
  reference?: string;
  school?: { name?: string };
  schoolName?: string;
};

type Filter = "ALL" | "PENDING";

export default function AdminPayoutsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPayouts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/payouts/admin", { params: filter === "PENDING" ? { status: "PENDING" } : undefined });
      setPayouts(unwrapList<Payout>(response.data, ["payouts"]));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load payouts."));
    } finally {
      setLoading(false);
    }
  }, [filter, user]);

  useEffect(() => {
    void loadPayouts();
  }, [loadPayouts]);

  async function markPaid(payout: Payout) {
    const id = getPayoutId(payout);
    if (!id) return;
    setUpdatingId(id);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/api/payouts/admin/${id}/paid`);
      setSuccess("Payout marked as paid.");
      await loadPayouts();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to mark payout as paid."));
    } finally {
      setUpdatingId("");
    }
  }

  const total = payouts.reduce((sum, payout) => sum + readNumber(payout.amount), 0);
  const pending = payouts.filter((payout) => String(payout.status).toUpperCase() === "PENDING").length;

  return (
    <AdminShell title="Payout management" eyebrow="Platform finance" actions={<Button onClick={() => void loadPayouts()} variant="ghost">Refresh</Button>}>
      <div className="mb-5 grid gap-5 sm:grid-cols-2">
        <StatCard label="Visible payouts" value={String(payouts.length)} detail={`${pending} pending`} tone="blue" />
        <StatCard label="Visible value" value={formatCurrency(total)} detail="Current filter total" tone="green" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button onClick={() => setFilter("ALL")} variant={filter === "ALL" ? "dark" : "ghost"}>All payouts</Button>
        <Button onClick={() => setFilter("PENDING")} variant={filter === "PENDING" ? "dark" : "ghost"}>Pending payouts</Button>
      </div>
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {success ? <div className="mb-4"><Alert tone="success">{success}</Alert></div> : null}
      {loading ? <LoadingPanel label="Loading payouts..." /> : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-emerald-700 to-cyan-600 text-white">
                <tr>
                  <th className="px-5 py-4">School</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((payout) => {
                  const id = getPayoutId(payout);
                  const isPaid = String(payout.status).toUpperCase() === "PAID";
                  return (
                    <tr key={id} className="hover:bg-green-50/50">
                      <td className="px-5 py-4 font-black text-slate-950">{readText(payout.school?.name ?? payout.schoolName, "Partner school")}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-bold">{formatCurrency(readNumber(payout.amount))}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{readText(payout.reference, id)}</td>
                      <td className="px-5 py-4"><StatusBadge status={payout.status} /></td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(payout.paidAt ?? payout.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Button disabled={isPaid || updatingId === id} onClick={() => void markPaid(payout)} className="min-h-8 px-3 py-1 text-xs">
                          {isPaid ? "Paid" : "Mark paid"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!payouts.length ? <EmptyState>No payouts found for this filter.</EmptyState> : null}
        </Card>
      )}
    </AdminShell>
  );
}

function getPayoutId(payout: Payout) {
  return String(payout.id ?? payout._id ?? payout.payoutId ?? "");
}

