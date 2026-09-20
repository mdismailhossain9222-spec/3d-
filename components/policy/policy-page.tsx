import Link from "next/link";
import { SectionHead } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";

export function PolicyPage({ kicker, title, intro, sections }: {
  kicker: string; title: string; intro: string;
  sections: { heading: string; body: string[]; list?: string[] }[];
}) {
  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-24 pt-32 md:px-8">
      <SectionHead kicker={kicker} title={title} sub={intro} />
      <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2">
        {sections.map((s, i) => (
          <a key={s.heading} href={`#s${i}`} className="rounded-full border border-white/10 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ash transition-colors hover:border-crimson/50 hover:text-mist">
            {String(i + 1).padStart(2, "0")} · {s.heading}
          </a>
        ))}
      </nav>
      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.heading} id={`s${i}`} className="scroll-mt-28">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white">
              <span className="mr-3 font-mono text-[12px] text-crimson">0{i + 1}</span>{s.heading}
            </h2>
            <div className="mt-3 space-y-3 pl-0 text-[13.5px] leading-relaxed text-ash md:pl-9">
              {s.body.map((p, j) => <p key={j}>{p}</p>)}
              {s.list && (
                <ul className="space-y-2 border-l border-crimson/30 pl-5">
                  {s.list.map((li) => <li key={li} className="relative text-mist before:absolute before:-left-[21px] before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-crimson">{li}</li>)}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/[0.07] bg-abyss/50 p-5">
        <p className="text-[12.5px] text-ash">Questions this didn&apos;t answer? Humans read everything.</p>
        <div className="flex gap-2">
          <ButtonLink href="/contact" size="md">Contact support</ButtonLink>
          <Link href="/support" className="inline-flex h-10 items-center rounded-sm px-4 font-mono text-[11px] uppercase tracking-widest text-ash transition-colors hover:text-white">Help center</Link>
        </div>
      </div>
    </div>
  );
}
