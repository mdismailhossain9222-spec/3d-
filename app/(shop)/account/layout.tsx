import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccountNav } from "@/components/account/account-nav";
import { Badge } from "@/components/ui/bits";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Account", template: "Account · %s" } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { name: true, email: true, phone: true, emailVerified: true, createdAt: true },
  });

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 pb-24 pt-28 md:px-8">
      <header className="mb-8 flex flex-wrap items-center gap-4 border-b border-white/[0.07] pb-6">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-b from-crimson to-[#7c0c11] font-display text-lg font-bold shadow-crim">
          {user?.name?.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="label-tech !text-[9px]">Member since {user?.createdAt.getFullYear()}</p>
          <h1 className="font-display text-xl font-bold tracking-tight">{user?.name}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user?.emailVerified ? <Badge tone="success">Email verified</Badge> : <Badge tone="warn">Verification pending</Badge>}
        </div>
      </header>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
