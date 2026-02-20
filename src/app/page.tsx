import { getServerSession } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  await getServerSession();
  return <DashboardClient />;
}
