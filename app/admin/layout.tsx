import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";

import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "Admin · %s" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/account");

  return (
    <div className="min-h-screen bg-void">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.07] bg-void/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1580px] items-center gap-4 px-4 md:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <svg viewBox="0 0 64 64" className="h-6 w-6 shrink-0" aria-hidden="true">
              <rect width="64" height="64" rx="14" fill="#0a0a0b" stroke="rgba(255,255,255,0.12)" />
              <path d="M20 46V18h24l-4 7H28v6h12l-4 7H28v8z" fill="#ffffff" />
              <rect x="40" y="38" width="7" height="7" transform="rotate(45 43.5 41.5)" fill="#D71920" />
            </svg>
            <span className="font-display text-[13px] font-bold uppercase tracking-[0.24em]">FAISTOF</span>
            <span className="rounded-sm border border-crimson/40 bg-crimson/10 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-crimson">Operations</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden font-mono text-[10.5px] text-ash sm:block">{session.email}</span>
            <Link href="/" className="rounded-sm border border-white/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mist transition-colors hover:border-crimson/50 hover:text-white">View store</Link>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1580px] gap-6 px-4 pb-16 pt-20 md:px-6">
        <aside className="hidden w-[196px] shrink-0 lg:block">
          <div className="sticky top-20"><AdminNav /></div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-void/95 backdrop-blur lg:hidden">
        <AdminNav rail />
      </div>
    </div>
  );
}
