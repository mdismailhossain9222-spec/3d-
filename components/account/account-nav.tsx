"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, User2, Package, Heart, MapPin, Settings2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useToast } from "@/components/toast";

const LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/profile", label: "Profile", icon: User2 },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/settings", label: "Settings", icon: Settings2 },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.dispatchEvent(new CustomEvent("fs:logout"));
    window.dispatchEvent(new CustomEvent("fs:user", { detail: null }));
    toast.push({ kind: "info", title: "Signed out" });
    router.push("/");
    router.refresh();
  };

  return (
    <nav aria-label="Account sections" className="lg:sticky lg:top-24 lg:self-start">
      <ul className="flex gap-1.5 overflow-x-auto no-scrollbar lg:flex-col lg:gap-0.5">
        {LINKS.map((l) => {
          const active = l.href === "/account" ? pathname === l.href : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                className={cn(
                  "relative flex items-center gap-2.5 whitespace-nowrap rounded-sm px-3.5 py-2.5 text-[12.5px] font-medium transition-colors",
                  active ? "text-white" : "text-ash hover:bg-white/[0.05] hover:text-mist"
                )}
              >
                {active && <motion.span layoutId="acct-active" className="absolute inset-0 -z-10 rounded-sm border border-crimson/30 bg-crimson/[0.09]" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                <Icon className={cn("h-4 w-4", active && "text-crimson")} />
                {l.label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-4 lg:border-t lg:border-white/[0.06] lg:pt-4">
          <button onClick={signOut} className="flex items-center gap-2.5 whitespace-nowrap rounded-sm px-3.5 py-2.5 text-[12.5px] font-medium text-ash transition-colors hover:bg-ember/10 hover:text-ember">
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
