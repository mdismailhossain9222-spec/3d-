"use client";

import { useState } from "react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminCard, LoadingBlock, useAdmin, mutate } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/field";
import { motion } from "framer-motion";

type Cat = { id: string; name: string; slug: string; description: string | null; _count: { products: number }; parent: { name: string; slug: string } | null };
type List = { ok: boolean; categories: Cat[] };

export default function AdminCategoriesPage() {
  const { data, loading, reload } = useAdmin<List>("/api/admin/categories");
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Cat | null>(null);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.push({ kind: "success", title: msg }); reload(); return true; }
    catch (e) { toast.push({ kind: "error", title: "Rejected", body: (e as Error).message }); return false; }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-tech">Structure</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Categories</h1>
        </div>
        <Button size="md" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" />New category</Button>
      </div>

      {loading || !data ? <LoadingBlock text="Loading categories…" /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.categories.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="group glass rounded-lg p-4 transition-colors hover:border-crimson/30">
                <div className="flex items-center gap-2.5">
                  <FolderTree className="h-4 w-4 text-crimson" />
                  <p className="font-display text-[14px] font-semibold">{c.name}</p>
                  <span className="num ml-auto rounded-full bg-white/[0.07] px-2 py-0.5 font-mono text-[10px] text-ash">{c._count.products}</span>
                </div>
                <p className="num mt-1.5 font-mono text-[10.5px] text-ash">/{c.slug}{c.parent && ` · under ${c.parent.name}`}</p>
                {c.description && <p className="mt-2 line-clamp-2 text-[11.5px] text-ash">{c.description}</p>}
                <div className="mt-3 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button onClick={() => setEditing(c)} aria-label={`Rename ${c.name}`} className="rounded-sm p-1.5 text-ash hover:bg-white/10 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => run(() => mutate("/api/admin/categories", "DELETE", { id: c.id }), "Category deleted")} aria-label={`Delete ${c.name}`} className="rounded-sm p-1.5 text-ash hover:bg-ember/10 hover:text-ember"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={adding} onOpenChange={setAdding} title="New category">
        <div className="space-y-4">
          <Field label="Name" required hint="slug is generated">{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tablets" />}</Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button disabled={name.trim().length < 2} onClick={async () => { const ok = await run(() => mutate("/api/admin/categories", "POST", { name: name.trim() }), "Category created"); if (ok) { setAdding(false); setName(""); } }}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(editing)} onOpenChange={(v) => !v && setEditing(null)} title="Edit category">
        {editing && (
          <div className="space-y-4">
            <Field label="Name">{(id) => <Input id={id} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />}</Field>
            <Field label="Description">{(id) => <Input id={id} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />}</Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={async () => { const ok = await run(() => mutate("/api/admin/categories", "PATCH", { id: editing.id, name: editing.name, description: editing.description ?? "" }), "Category saved"); if (ok) setEditing(null); }}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
