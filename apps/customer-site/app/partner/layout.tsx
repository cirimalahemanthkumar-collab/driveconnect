import type { ReactNode } from "react";
import { AppShell, partnerLinks } from "../../components/app-shell";
import { RoleGuard } from "../../components/role-guard";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["SCHOOL_OWNER"]}>
      <AppShell role="School owner" title="Partner operations" links={partnerLinks}>{children}</AppShell>
    </RoleGuard>
  );
}
