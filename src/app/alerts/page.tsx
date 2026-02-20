import { getServerSession } from "@/lib/auth";
import { AlertsPageClient } from "@/components/dashboard/alerts-page-client";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  await getServerSession();
  return <AlertsPageClient />;
}
