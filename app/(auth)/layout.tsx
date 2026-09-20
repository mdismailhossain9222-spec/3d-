import Link from "next/link";
import Logo from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(45%_38%_at_50%_0%,rgba(215,25,32,0.14),transparent_70%),radial-gradient(60%_40%_at_50%_115%,rgba(120,10,14,0.2),transparent_65%)]" />
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]">
        <defs>
          <pattern id="auth-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0H0V56" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>
      <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-8">
        <Logo />
        <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash transition-colors hover:text-white">← Back to store</Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-4">{children}</main>
      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 border-t border-white/[0.06] px-4 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
        <Link href="/privacy" className="hover:text-mist">Privacy</Link>
        <Link href="/terms" className="hover:text-mist">Terms</Link>
        <Link href="/support" className="hover:text-mist">Support</Link>
      </footer>
    </div>
  );
}
