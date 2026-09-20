/** Money is stored as integer poisha (1 BDT = 100 poisha) to avoid float drift. */
export function formatTk(poisha: number, opts?: { compact?: boolean }): string {
  const taka = poisha / 100;
  if (opts?.compact && taka >= 100000) return `৳${(taka / 100000).toFixed(1)}L`;
  return `৳${taka.toLocaleString("en-US", { maximumFractionDigits: taka % 1 ? 2 : 0 })}`;
}

export function tkToPoisha(taka: number | string): number {
  return Math.round(Number(taka) * 100);
}

export const TAX_RATE = 0.05;
export const FREE_SHIPPING_THRESHOLD = 5000000; // ৳50,000 in poisha
export const SHIPPING_STANDARD = 29900; // ৳299
export const SHIPPING_EXPRESS = 150000; // ৳1,500
export const SHIPPING_PICKUP = 0;
