import type { ReactNode } from "react";
import { AppShell, customerLinks } from "../../components/app-shell";
import { RoleGuard } from "../../components/role-guard";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["CUSTOMER"]}>
      <AppShell role="Customer" title="Learner workspace" links={customerLinks}>{children}</AppShell>
    </RoleGuard>
  );
}

