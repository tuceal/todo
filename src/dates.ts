export const MONTHS = ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"];
export const WEEKDAYS = ["pazar", "pazartesi", "salı", "çarşamba", "perşembe", "cuma", "cumartesi"];

export function toISODate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(n: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Bugüne göre gün farkı (negatif = geçmiş) */
export function daysFromToday(iso: string, now = new Date()) {
  const today = parseISO(toISODate(now));
  return Math.round((parseISO(iso).getTime() - today.getTime()) / 86_400_000);
}

export function formatDay(iso: string) {
  const diff = daysFromToday(iso);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Yarın";
  if (diff === -1) return "Dün";
  if (diff < 0) return `${-diff} gün gecikti`;
  if (diff < 7) return parseISO(iso).toLocaleDateString("tr-TR", { weekday: "long" });
  return parseISO(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function formatDue(iso: string, time?: string) {
  return time ? `${formatDay(iso)} ${time}` : formatDay(iso);
}

/** "Çar, 14 Ekim" */
export function formatLong(iso: string) {
  const d = parseISO(iso);
  const wd = d.toLocaleDateString("tr-TR", { weekday: "short" });
  return `${wd}, ${d.getDate()} ${d.toLocaleDateString("tr-TR", { month: "long" })}`;
}

/** "Salı, 13 Ekim" */
export function todayLabel() {
  const d = new Date();
  return `${d.toLocaleDateString("tr-TR", { weekday: "long" })}, ${d.getDate()} ${d.toLocaleDateString("tr-TR", { month: "long" })}`;
}

const stamp = (iso: string, time?: string) => iso.replace(/-/g, "") + (time ? `T${time.replace(":", "")}00` : "");

/**
 * Google Takvim'in "yeni etkinlik" sayfası, bilgiler dolu. İzin/giriş gerektirmez;
 * kullanıcı sadece Kaydet'e basar, hatırlatmayı takvim yapar.
 */
export function calendarUrl(title: string, iso: string, time?: string) {
  let dates: string;
  if (time) {
    const [h, m] = time.split(":").map(Number);
    const end = new Date(parseISO(iso));
    end.setHours(h + 1, m);
    const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
    dates = `${stamp(iso, time)}/${stamp(toISODate(end), endTime)}`;
  } else {
    dates = `${stamp(iso)}/${stamp(addDays(1, parseISO(iso)))}`;
  }
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Istanbul",
    details: "To-Do Magic",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
