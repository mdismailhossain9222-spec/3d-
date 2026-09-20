"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Boxes, Receipt, Users, FolderTree, Ticket, Star, Timer, BarChart3, Settings2, Mail,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/deals", label: "Deals", icon: Timer },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
];

export function AdminNav({ rail }: { rail?: boolean }) {
  const pathname = usePathname();
  if (rail) {
    return (
      <nav aria-label="Admin sections" className="flex justify-around overflow-x-auto no-scrollbar px-2 py-1.5">
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          const Icon = l.icon;
          return <Link key={l.href} href={l.href} aria-label={l.label} className={cn("rounded-sm p-2.5 transition-colors", active ? "bg-crimson/15 text-crimson" : "text-ash")}><Icon className="h-[18px] w-[18px]" /></Link>;
        })}
      </nav>
    );
  }
  return (
    <nav aria-label="Admin sections">
      <ul className="space-y-0.5">
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <li key={l.href}>
              <Link href={l.href} className={cn("flex items-center gap-2.5 rounded-sm border-l-2 px-3 py-2 text-[12.5px] transition-colors", active ? "border-crimson bg-crimson/[0.07] text-white" : "border-transparent text-ash hover:bg-white/[0.04] hover:text-mist")}>
                <Icon className={cn("h-4 w-4", active && "text-crimson")} />{l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
