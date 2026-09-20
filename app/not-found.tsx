import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-void px-4 text-center">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(40%_40%_at_50%_60%,rgba(215,25,32,0.14),transparent_70%)]" />
      <div className="relative">
        <p className="select-none font-display text-[clamp(6rem,22vw,14rem)] font-bold leading-none tracking-tighter text-white/[0.06]">404</p>
        <h1 className="mt-[-4rem] font-display text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">Signal lost in the void.</h1>
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-ash">
          This corridor doesn&apos;t exist in our floor plan. The flagship, the store and the deals are all a step back toward the light.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex h-11 items-center rounded-sm bg-gradient-to-b from-crimson to-[#a80f15] px-7 font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-crim transition-all hover:from-ember active:scale-[0.97]">Return home</Link>
          <Link href="/shop" className="inline-flex h-11 items-center rounded-sm border border-white/25 px-7 font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-mist transition-all hover:border-white/60 active:scale-[0.97]">Enter the store</Link>
        </div>
      </div>
    </div>
  );
}
