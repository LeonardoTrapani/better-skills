import { requireSession } from "@/lib/auth/require-session";
import EnterpriseSettingsView from "./_components/enterprise-settings-view";

interface EnterpriseSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EnterpriseSettingsPage({ params }: EnterpriseSettingsPageProps) {
  const { slug } = await params;
  await requireSession(`/settings/enterprise/${slug}`);
  return <EnterpriseSettingsView slug={slug} />;
}
