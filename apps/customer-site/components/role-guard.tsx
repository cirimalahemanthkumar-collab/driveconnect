"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { destinationFor, useAuth, type AppRole } from "./auth-provider";
import { LoadingState } from "./portal-ui";

export function RoleGuard({ roles, children }: { roles: AppRole[]; children: ReactNode }) {
  const router = useRouter();
  const { loading, user } = useAuth();
  const allowed = Boolean(user && roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!allowed) router.replace(destinationFor(user.role));
  }, [allowed, loading, router, user]);

  if (loading || !allowed) {
    return <LoadingState label="Checking your DriveConnect account..." />;
  }

  return <>{children}</>;
}
