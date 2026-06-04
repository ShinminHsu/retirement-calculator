// Shared formatting helpers.

export function twd(n: number): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

// Compact "萬" formatting for large planning numbers.
export function wan(n: number): string {
  if (!isFinite(n)) return "—";
  const w = n / 10_000;
  if (Math.abs(w) >= 10_000) {
    return `${(w / 10_000).toFixed(2)} 億`;
  }
  return `${w.toLocaleString("zh-TW", { maximumFractionDigits: 1 })} 萬`;
}

export function pct(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function num(n: number): string {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}
