import { getServerSession } from "@/lib/auth";
import { ProfilePageClient } from "@/components/dashboard/profile-page-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession();
  return <ProfilePageClient session={session} />;
}
