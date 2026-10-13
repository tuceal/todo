export function toISODate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Bugüne göre gün farkı (negatif = geçmiş) */
export function daysFromToday(iso: string) {
  const today = parse(toISODate(new Date()));
  return Math.round((parse(iso).getTime() - today.getTime()) / 86_400_000);
}

export function formatDue(iso: string) {
  const diff = daysFromToday(iso);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Yarın";
  if (diff === -1) return "Dün";
  if (diff < 0) return `${-diff} gün gecikti`;
  if (diff < 7) return parse(iso).toLocaleDateString("tr-TR", { weekday: "long" });
  return parse(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
