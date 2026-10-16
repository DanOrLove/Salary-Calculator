export function parseAmount(value: string): number {
  let cleaned = "";
  for (const char of value) {
    if (char >= "0" && char <= "9") {
      cleaned += char;
    } else if ((char === "." || char === ",") && !cleaned.includes(".")) {
      cleaned += ".";
    }
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatAmountInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);
}
