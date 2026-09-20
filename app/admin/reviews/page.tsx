"use client";

import { useMemo, useState } from "react";
import { Check, ThumbsUp, Trash2, X } from "lucide-react";
import Link from "next/link";
import { AdminCard, LoadingBlock, useAdmin, mutate } from "@/components/admin/admin-ui";
import { Badge, Rating, TabBar } from "@/components/ui/bits";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

type R = {
  id: string; authorName: string; rating: number; title: string; body: string;
  verified: boolean; approved: boolean; helpful: number; createdAt: string;
  product: { name: string; slug: string };
};
type List = { ok: boolean; reviews: R[] };

export default function AdminReviewsPage() {
  const { data, loading, reload } = useAdmin<List>("/api/admin/reviews");
  const toast = useToast();
  const [tab, setTab] = useState("all");
  const rows = useMemo(() => {
    const all = data?.reviews ?? [];
    return tab === "pending" ? all.filter((r) => !r.approved) : tab === "all" ? all : all.filter((r) => r.approved);
  }, [data, tab]);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.push({ kind: "success", title: msg }); reload(); }
    catch (e) { toast.push({ kind: "error", title: "Rejected", body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-tech">Trust</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Reviews</h1>
        </div>
        <TabBar idPrefix="admrev" tabs={[{ key: "all", label: "All" }, { key: "pending", label: `Pending (${data?.reviews.filter((r) => !r.approved).length ?? 0})` }, { key: "approved", label: "Approved" }]} active={tab} onChange={setTab} />
      </div>

      {loading || !data ? <LoadingBlock text="Loading reviews…" /> : rows.length === 0 ? (
        <p className="glass-deep rounded-lg py-14 text-center text-[12.5px] text-ash">{tab === "pending" ? "Moderation queue is empty. Inbox zero, review edition." : "No reviews in this view."}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.id} className={cn("glass-deep rounded-lg p-4", !r.approved && "border-crimson/25")}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-[13px] font-semibold">{r.authorName}</span>
                <Rating value={r.rating} />
                <Link href={`/product/${r.product.slug}`} className="num font-mono text-[10.5px] text-crimson hover:underline">on {r.product.name}</Link>
                {r.verified && <Badge tone="success">verified buyer</Badge>}
                <Badge tone={r.approved ? "outline" : "warn"}>{r.approved ? "approved" : "pending"}</Badge>
                <span className="num ml-auto flex items-center gap-1 font-mono text-[10.5px] text-ash"><ThumbsUp className="h-3 w-3" />{r.helpful}</span>
              </div>
              <p className="mt-2 font-display text-[13px] font-semibold">{r.title}</p>
              <p className="mt-1 max-h-24 overflow-hidden text-[12.5px] leading-relaxed text-ash">{r.body}</p>
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => run(() => mutate("/api/admin/reviews", "PATCH", { id: r.id, approved: !r.approved }), r.approved ? "Unpublished" : "Published — rating aggregate updated")} className={cn("flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors", r.approved ? "border-white/15 text-ash hover:text-white" : "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10")}>
                  {r.approved ? <><X className="h-3 w-3" />Unpublish</> : <><Check className="h-3 w-3" />Approve</>}
                </button>
                <button onClick={() => { if (confirm("Delete this review permanently?")) run(() => mutate("/api/admin/reviews", "DELETE", { id: r.id }), "Review deleted"); }} className="flex items-center gap-1.5 rounded-sm border border-ember/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ember transition-colors hover:bg-ember/10">
                  <Trash2 className="h-3 w-3" />Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
