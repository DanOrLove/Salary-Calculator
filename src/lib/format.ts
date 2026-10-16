const RUB = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const RUB_PRECISE = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PLAIN = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export function money(value: number, precise = false): string {
  const safe = Number.isFinite(value) ? value : 0;
  return (precise ? RUB_PRECISE : RUB).format(safe);
}

export function number(value: number): string {
  return PLAIN.format(Number.isFinite(value) ? value : 0);
}

export function moneyShort(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  if (abs >= 1000000) {
    const millions = safe / 1000000;
    return millions.toFixed(1).replace(".", ",") + " млн";
  }
  if (abs >= 10000) {
    return Math.round(safe / 1000) + "к";
  }
  return PLAIN.format(safe);
}

export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function percent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(safe * 100) / 100;
  return String(rounded).replace(".", ",") + "%";
}
