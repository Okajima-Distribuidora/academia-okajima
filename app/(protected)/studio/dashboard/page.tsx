import type { Metadata } from "next";

import { StudioDashboard } from "@/components/studio/dashboard/studio-dashboard";
import { requireStudioUser } from "@/lib/auth/session";
import { getStudioStats } from "@/lib/studio/stats";

export const metadata: Metadata = { title: "Dashboard | Academia Studio" };

export default async function StudioDashboardPage() {
  await requireStudioUser();
  const stats = await getStudioStats();

  return <StudioDashboard stats={stats} />;
}
