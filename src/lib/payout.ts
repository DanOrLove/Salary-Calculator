export function calcPayout(basePayout: number, salesPercent: number, total: number): number {
  const base = Number.isFinite(basePayout) ? basePayout : 0;
  const share = Number.isFinite(salesPercent) ? salesPercent : 0;
  const sold = Number.isFinite(total) ? total : 0;
  return Math.round((base + (share / 100) * sold) * 100) / 100;
}

export function calcBonus(salesPercent: number, total: number): number {
  const share = Number.isFinite(salesPercent) ? salesPercent : 0;
  const sold = Number.isFinite(total) ? total : 0;
  return Math.round((share / 100) * sold * 100) / 100;
}
