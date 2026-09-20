import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/account/profile-form";

export default async function ProfilePage() {
  const u = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: u.id }, select: { name: true, email: true, phone: true, emailVerified: true, createdAt: true } });
  return <ProfileForm initial={user!} />;
}
