import type { ReactNode } from "react";

import { getDashboardPath } from "@/auth/routes";
import { requireAuthenticatedSession } from "@/auth/session";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  await requireAuthenticatedSession(getDashboardPath());

  return children;
}
