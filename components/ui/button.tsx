"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export type BtnVariant = "primary" | "outline" | "ghost" | "subtle" | "danger";
export type BtnSize = "sm" | "md" | "lg" | "xl";

export function buttonStyles(variant: BtnVariant = "primary", size: BtnSize = "md", full?: boolean) {
  return cn(
    "group/btn relative inline-flex items-center justify-center gap-2 font-display font-semibold tracking-wide whitespace-nowrap select-none rounded-sm transition-colors duration-200",
    "disabled:pointer-events-none disabled:opacity-45",
    full && "w-full",
    {
      sm: "h-8 px-3.5 text-[11px]",
      md: "h-10 px-5 text-[13px]",
      lg: "h-12 px-7 text-[14px]",
      xl: "h-14 px-9 text-[15px]",
    }[size],
    {
      primary:
        "text-white bg-gradient-to-b from-crimson to-[#a30f15] shadow-crim hover:from-ember hover:to-[#c01219] active:from-[#b91219]",
      outline: "border border-white/25 text-snow hover:border-crimson/70 hover:bg-crimson/10",
      ghost: "text-mist/90 hover:text-white hover:bg-white/[0.06]",
      subtle: "bg-white/[0.07] text-mist hover:bg-white/[0.12] border border-white/[0.04]",
      danger: "bg-white/5 text-ember border border-ember/40 hover:bg-ember/15",
    }[variant]
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type CommonProps = {
  variant?: BtnVariant;
  size?: BtnSize;
  full?: boolean;
  loading?: boolean;
  magnetic?: boolean;
  className?: string;
  children?: React.ReactNode;
};

/** Magnetic offset for premium pointer feel (desktop, motion allowed). */
function useMagnet(active?: boolean) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 320, damping: 22, mass: 0.4 });
  const y = useSpring(my, { stiffness: 320, damping: 22, mass: 0.4 });
  const handlers = active && !reduce
    ? {
        onMouseMove: (e: React.MouseEvent<HTMLElement>) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - (r.left + r.width / 2)) * 0.18);
          my.set((e.clientY - (r.top + r.height / 2)) * 0.18);
        },
        onMouseLeave: () => { mx.set(0); my.set(0); },
      }
    : {};
  return { x, y, handlers };
}

export const Button = forwardRef<HTMLButtonElement, CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ variant = "primary", size = "md", full, loading, magnetic, className, children, disabled, ...rest }, ref) => {
    const { x, y, handlers } = useMagnet(magnetic);
    const reduce = useReducedMotion();
    return (
      <motion.button
        ref={ref}
        style={{ x, y }}
        whileTap={reduce ? undefined : { scale: 0.965 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        {...handlers}
        disabled={disabled || loading}
        className={buttonStyles(variant, size, full) + (className ? ` ${className}` : "")}
        {...(rest as unknown as HTMLMotionProps<"button">)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {loading ? <Spinner key="s" /> : null}
        </AnimatePresence>
        <span className="inline-flex items-center gap-2">{children}</span>
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export function ButtonLink({
  href, variant = "primary", size = "md", full, className, children, ...rest
}: CommonProps & { href: string } & Omit<React.ComponentProps<typeof Link>, "className" | "children">) {
  const { x, y, handlers } = useMagnet(magneticOf(rest));
  return (
    <motion.div style={{ x, y }} className="inline-flex" {...handlers}>
      <Link href={href} className={buttonStyles(variant, size, full) + (className ? ` ${className}` : "")}>
        <span className="inline-flex items-center gap-2">{children}</span>
      </Link>
    </motion.div>
  );
}
function magneticOf(rest: Record<string, unknown>) {
  return Boolean((rest as { magnetic?: boolean }).magnetic);
}
