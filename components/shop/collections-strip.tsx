import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STRIP = [
  { href: "/phones", title: "Phones", note: "ONE · PRO · ULTRA · LITE", img: "/renders/hero-obsidian.jpg" },
  { href: "/accessories", title: "Ecosystem", note: "Watch · Buds · Charge · Case · Power", img: "/renders/macro-camera.jpg" },
  { href: "/deals", title: "Live deals", note: "Flash windows & bundles", img: "/renders/macro-camera.jpg" },
];

export function LinkGrid() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {STRIP.map((s) => (
        <Link key={s.href} href={s.href} className="group relative overflow-hidden rounded-md border border-white/[0.07] bg-gradient-to-b from-iron to-abyss p-5 transition-colors hover:border-crimson/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-[14px] font-semibold uppercase tracking-wide">{s.title}</p>
              <p className="mt-1 text-[11px] text-ash">{s.note}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-crimson transition-transform duration-300 group-hover:translate-x-1" />
          </div>
          <img src={s.img} alt="" aria-hidden className="pointer-events-none absolute -bottom-6 -right-4 h-24 w-24 rotate-[18deg] object-contain opacity-20 blur-[1px] transition-all duration-500 group-hover:rotate-[8deg] group-hover:opacity-40" />
        </Link>
      ))}
    </div>
  );
}
