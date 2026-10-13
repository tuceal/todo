import { MONTHS, WEEKDAYS, addDays, toISODate } from "./dates.ts";
import type { Priority } from "./store.ts";

export type SpanKind = "date" | "time" | "priority" | "category";

export interface Span {
  start: number;
  end: number;
  kind: SpanKind;
}

export interface Parsed {
  title: string;
  dueDate?: string;
  time?: string;
  priority?: Priority;
  category?: string;
  spans: Span[];
}

// Türkçe harfler için \b çalışmaz; kelime sınırını elle tanımlıyoruz
const B = "(?<![\\p{L}\\d])";
const E = "(?![\\p{L}\\d])";
// Ekler: 'de/'da/'te/'ta, -ya/-ye, -ki, -den … (kesme işaretli ya da bitişik)
const SUFFIX = "(?:['’]?(?:d[ae]n?|t[ae]n?|y?[ae]|n?[ıiuü]n|ki))?";

const HOUR_WORDS: Record<string, number> = {
  bir: 1, iki: 2, "üç": 3, "dört": 4, "beş": 5, "altı": 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10, "on bir": 11, "on iki": 12,
};
const HOUR_WORD_RE = Object.keys(HOUR_WORDS).sort((a, b) => b.length - a.length).join("|");

type Hit = Span & { apply: (r: Parsed, now: Date) => void };

function regex(src: string) {
  return new RegExp(src, "giu");
}

/** Saat ipucu olmadan söylenen 1–7 öğleden sonra kabul edilir ("saat 4" → 16:00). */
function toTime(hour: number, minute: number, marker?: string) {
  let h = hour;
  if (marker === "sabah") h = hour === 12 ? 0 : hour;
  else if (marker === "öğlen" || marker === "öğle") h = hour < 12 && hour <= 5 ? hour + 12 : hour;
  else if (marker === "öğleden sonra" || marker === "akşam") h = hour < 12 ? hour + 12 : hour;
  else if (marker === "gece") h = hour >= 5 && hour < 12 ? hour + 12 : hour === 12 ? 0 : hour;
  else if (hour >= 1 && hour <= 7) h = hour + 12;
  if (h > 23 || minute > 59) return undefined;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function collect(lower: string, categories: string[]): Hit[] {
  const hits: Hit[] = [];
  const add = (re: RegExp, kind: SpanKind, fn: (m: RegExpExecArray) => ((r: Parsed, now: Date) => void) | null) => {
    for (const m of lower.matchAll(re)) {
      const apply = fn(m);
      if (apply) hits.push({ start: m.index!, end: m.index! + m[0].length, kind, apply });
    }
  };

  // ---- Tarih ----
  add(regex(`${B}(?:bugün(?:kü|ün)?|bu\\s+(?:sabah|akşam|gece))${E}`), "date", () => (r, now) => (r.dueDate = addDays(0, now)));
  add(regex(`${B}(?:öbür\\s+gün|ertesi\\s+gün|yarından\\s+sonra)${E}`), "date", () => (r, now) => (r.dueDate = addDays(2, now)));
  add(regex(`${B}yarın(?:a|ki|dan|ın)?${E}(?!\\s+sonra)`), "date", () => (r, now) => (r.dueDate = addDays(1, now)));
  add(regex(`${B}(\\d{1,2})\\s+gün\\s+sonra${SUFFIX}${E}`), "date", (m) => (r, now) => (r.dueDate = addDays(Number(m[1]), now)));
  add(regex(`${B}(?:haftaya|gelecek\\s+hafta|önümüzdeki\\s+hafta)${E}(?!\\s+(?:${WEEKDAYS.join("|")}))`), "date", () => (r, now) => (r.dueDate = addDays(7, now)));

  const days = [...WEEKDAYS].sort((a, b) => b.length - a.length).join("|");
  add(
    regex(`${B}(?:(haftaya|gelecek\\s+hafta|önümüzdeki\\s+hafta)\\s+)?(${days})(?:\\s+günü)?${SUFFIX}${E}`),
    "date",
    (m) => (r, now) => {
      const target = WEEKDAYS.indexOf(m[2]);
      let diff = (target - now.getDay() + 7) % 7 || 7;
      if (m[1] && diff < 7) diff += 7;
      r.dueDate = addDays(diff, now);
    },
  );

  add(regex(`${B}(\\d{1,2})\\s+(${MONTHS.join("|")})${SUFFIX}${E}`), "date", (m) => {
    const day = Number(m[1]);
    const month = MONTHS.indexOf(m[2]);
    if (day < 1 || day > 31) return null;
    return (r, now) => {
      let d = new Date(now.getFullYear(), month, day);
      if (toISODate(d) < toISODate(now)) d = new Date(now.getFullYear() + 1, month, day);
      r.dueDate = toISODate(d);
    };
  });

  add(regex(`${B}ayın\\s+(\\d{1,2})${SUFFIX}${E}`), "date", (m) => {
    const day = Number(m[1]);
    if (day < 1 || day > 31) return null;
    return (r, now) => {
      let d = new Date(now.getFullYear(), now.getMonth(), day);
      if (toISODate(d) < toISODate(now)) d = new Date(now.getFullYear(), now.getMonth() + 1, day);
      r.dueDate = toISODate(d);
    };
  });

  // ---- Saat ----
  const marker = "(sabah|öğleden\\s+sonra|öğlen|öğle|akşam|gece)";
  add(regex(`${B}(?:${marker}\\s+)?(?:saat\\s+)?(\\d{1,2})[:.](\\d{2})${SUFFIX}${E}`), "time", (m) => {
    const t = toTime(Number(m[2]), Number(m[3]), m[1]?.replace(/\s+/, " "));
    return t ? (r) => (r.time = t) : null;
  });
  add(
    regex(`${B}(?:${marker}\\s+)?saat\\s+(\\d{1,2}|${HOUR_WORD_RE})(\\s+buçuk)?${SUFFIX}${E}`),
    "time",
    (m) => {
      const hour = /\d/.test(m[2]) ? Number(m[2]) : HOUR_WORDS[m[2]];
      const t = toTime(hour, m[3] ? 30 : 0, m[1]?.replace(/\s+/, " "));
      return t ? (r) => (r.time = t) : null;
    },
  );
  add(regex(`${B}${marker}\\s+(\\d{1,2})(\\s+buçuk)?${SUFFIX}${E}`), "time", (m) => {
    const t = toTime(Number(m[2]), m[3] ? 30 : 0, m[1].replace(/\s+/, " "));
    return t ? (r) => (r.time = t) : null;
  });
  // "4'te", "10'da" (kesme işaretli tek sayı)
  add(regex(`${B}(\\d{1,2})['’](?:d[ae]|t[ae])${E}`), "time", (m) => {
    const t = toTime(Number(m[1]), 0);
    return t ? (r) => (r.time = t) : null;
  });
  add(regex(`${B}öğlen(?:de)?${E}`), "time", () => (r) => (r.time = "12:00"));

  // ---- Öncelik (kelime başlıkta kalır, sadece işaretlenir) ----
  add(regex(`${B}(?:çok\\s+)?(?:önemli|acil|kritik|öncelikli)${E}`), "priority", () => (r) => (r.priority = "high"));

  // ---- Kategori: mevcut kategori adı geçiyorsa ----
  for (const cat of categories) {
    const name = cat.toLocaleLowerCase("tr").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    add(regex(`${B}#?${name}${SUFFIX}${E}`), "category", () => (r) => (r.category = cat));
  }

  return hits;
}

/** Çakışan eşleşmelerde uzun olan kazanır ("cuma günü" > "cuma", "saat 4 buçuk" > "4"). */
function resolve(hits: Hit[]) {
  const sorted = [...hits].sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const kept: Hit[] = [];
  for (const h of sorted) {
    if (!kept.some((k) => h.start < k.end && k.start < h.end)) kept.push(h);
  }
  return kept.sort((a, b) => a.start - b.start);
}

function cleanTitle(text: string, removed: Span[]) {
  let out = "";
  let pos = 0;
  for (const s of removed) {
    out += text.slice(pos, s.start) + " ";
    pos = s.end;
  }
  out += text.slice(pos);
  out = out
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/^[\s,.;:-]+|[\s,;:-]+$/g, "")
    .trim();
  return out ? out.charAt(0).toLocaleUpperCase("tr") + out.slice(1) : "";
}

export function parseTask(input: string, categories: string[] = [], now = new Date()): Parsed {
  const lower = input.toLocaleLowerCase("tr");
  const hits = resolve(collect(lower, categories));
  const result: Parsed = { title: "", spans: hits.map(({ start, end, kind }) => ({ start, end, kind })) };
  for (const h of hits) h.apply(result, now);

  // Sadece saat söylendiyse: geçmediyse bugün, geçtiyse yarın
  if (result.time && !result.dueDate) {
    const [h, m] = result.time.split(":").map(Number);
    const passed = h * 60 + m <= now.getHours() * 60 + now.getMinutes();
    result.dueDate = addDays(passed ? 1 : 0, now);
  }

  const removed = hits.filter((h) => h.kind === "date" || h.kind === "time");
  result.title = cleanTitle(input, removed) || input.trim();
  return result;
}

/** "süt, yumurta ve ekmek" → ["Süt", "Yumurta", "Ekmek"] */
export function splitItems(input: string) {
  return input
    .split(/\s*(?:,|;|\n|\s+ve\s+|\s+bir\s+de\s+)\s*/iu)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toLocaleUpperCase("tr") + s.slice(1));
}
