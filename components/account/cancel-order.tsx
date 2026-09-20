"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban } from "lucide-react";
import { useToast } from "@/components/toast";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const cancel = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/account/orders/${orderId}/cancel`, { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        toast.push({ kind: "info", title: "Order cancelled", body: "Stock returned to inventory; any payment is refunded by the provider." });
        setConfirm(false);
        router.refresh();
      } else toast.push({ kind: "error", title: "Couldn't cancel", body: d.error });
    } catch {
      toast.push({ kind: "error", title: "Network error" });
    } finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={() => setConfirm(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm border border-ember/40 py-2.5 text-[11.5px] font-medium text-ember transition-all hover:bg-ember/10 active:scale-[0.98]">
        <Ban className="h-3.5 w-3.5" />Cancel order
      </button>
      <Modal open={confirm} onOpenChange={setConfirm} title="Cancel this order?">
        <p className="text-[13px] leading-relaxed text-ash">We&apos;ll release the held units back to stock and stop the courier. Paid amounts are refunded by the gateway — this cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>Keep order</Button>
          <Button variant="danger" loading={busy} onClick={cancel}>Yes, cancel it</Button>
        </div>
      </Modal>
    </>
  );
}
