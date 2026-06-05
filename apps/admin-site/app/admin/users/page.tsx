"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import { Alert, Badge, Button, Card, EmptyState, LoadingPanel, StatusBadge, formatDate } from "../../../components/ui";
import { api, getApiError, readText, unwrapList } from "../../../lib/api";

type UserAccount = {
  id?: string;
  _id?: string;
  full_name?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  lastLoginAt?: string;
  last_login_at?: string;
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/admin/users");
      setUsers(unwrapList<UserAccount>(response.data, ["users"]));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load users."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <AdminShell title="Users" eyebrow="Accounts" actions={<Button onClick={() => void loadUsers()} variant="ghost">Refresh</Button>}>
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {loading ? <LoadingPanel label="Loading users..." /> : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white">
                <tr>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Joined</th>
                  <th className="px-5 py-4">Last login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((account, index) => (
                  <tr key={getUserId(account, index)} className="hover:bg-blue-50/50">
                    <td className="px-5 py-4 font-black text-slate-950">{getUserName(account)}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{readText(account.email)}</p>
                      <p className="text-xs text-slate-500">{readText(account.phone)}</p>
                    </td>
                    <td className="px-5 py-4"><Badge tone="indigo">{readText(account.role).replace(/_/g, " ")}</Badge></td>
                    <td className="px-5 py-4"><StatusBadge status={account.status} /></td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(account.createdAt ?? account.created_at)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(account.lastLoginAt ?? account.last_login_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!users.length ? <EmptyState>No users found.</EmptyState> : null}
        </Card>
      )}
    </AdminShell>
  );
}

function getUserId(account: UserAccount, index: number) {
  return String(account.id ?? account._id ?? index);
}

function getUserName(account: UserAccount) {
  return readText(account.full_name ?? account.fullName ?? account.name, "Unnamed user");
}
