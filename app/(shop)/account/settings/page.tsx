import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsForms } from "@/components/account/settings-forms";

export default async function SettingsPage() {
  const u = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: u.id }, select: { marketingOptIn: true, email: true } });
  return <SettingsForms email={user!.email} marketing={user!.marketingOptIn} />;
}
