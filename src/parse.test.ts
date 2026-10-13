import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTask, splitItems } from "./parse.ts";

// Sabit "şimdi": Salı, 13 Ekim 2026, 10:00
const NOW = new Date(2026, 9, 13, 10, 0);
const p = (s: string, cats: string[] = []) => parseTask(s, cats, NOW);

const cases: [string, Partial<ReturnType<typeof parseTask>>][] = [
  ["Yarın saat 4'te Beril ile önemli toplantı", { title: "Beril ile önemli toplantı", dueDate: "2026-10-14", time: "16:00", priority: "high" }],
  ["yarın belirle saat 4'te toplantı", { title: "Belirle toplantı", dueDate: "2026-10-14", time: "16:00" }],
  ["süt al", { title: "Süt al", dueDate: undefined, time: undefined }],
  ["cuma günü faturayı öde", { title: "Faturayı öde", dueDate: "2026-10-16" }],
  ["cumartesi annemleri ziyaret", { title: "Annemleri ziyaret", dueDate: "2026-10-17" }],
  ["salı spor", { title: "Spor", dueDate: "2026-10-20" }],
  ["haftaya pazartesi dişçi", { title: "Dişçi", dueDate: "2026-10-26" }],
  ["haftaya rapor teslimi", { title: "Rapor teslimi", dueDate: "2026-10-20" }],
  ["bugün akşam 7'de annemi ara", { title: "Annemi ara", dueDate: "2026-10-13", time: "19:00" }],
  ["sabah 9'da koşu", { title: "Koşu", dueDate: "2026-10-14", time: "09:00" }],
  ["saat 14:30'da kuaför", { title: "Kuaför", dueDate: "2026-10-13", time: "14:30" }],
  ["saat 3 buçukta çocukları al", { title: "Çocukları al", dueDate: "2026-10-13", time: "15:30" }],
  ["saat dörtte kahve", { title: "Kahve", time: "16:00" }],
  ["15 kasımda doğum günü hediyesi", { title: "Doğum günü hediyesi", dueDate: "2026-11-15" }],
  ["2 ekim vergi", { dueDate: "2027-10-02" }],
  ["3 gün sonra kargoyu kontrol et", { title: "Kargoyu kontrol et", dueDate: "2026-10-16" }],
  ["öbür gün banka", { title: "Banka", dueDate: "2026-10-15" }],
  ["acil sunumu gönder", { title: "Acil sunumu gönder", priority: "high" }],
  ["öğlen yemek rezervasyonu", { title: "Yemek rezervasyonu", time: "12:00" }],
  ["iş toplantısı yarın", { title: "İş toplantısı", category: "İş", dueDate: "2026-10-14" }],
  ["Bir şey al", { title: "Bir şey al", time: undefined }],
];

for (const [input, expected] of cases) {
  test(input, () => {
    const r = p(input, ["İş", "Ev"]);
    for (const [k, v] of Object.entries(expected)) assert.equal(r[k as keyof typeof r], v, `${k} — "${input}"`);
  });
}

test("vurgular orijinal metinde doğru yeri gösterir", () => {
  const input = "Yarın saat 4'te Beril ile önemli toplantı";
  const r = p(input);
  assert.deepEqual(
    r.spans.map((s) => [input.slice(s.start, s.end), s.kind]),
    [["Yarın", "date"], ["saat 4'te", "time"], ["önemli", "priority"]],
  );
});

test("alışveriş listesini böler", () => {
  assert.deepEqual(splitItems("süt, yumurta ve ekmek"), ["Süt", "Yumurta", "Ekmek"]);
  assert.deepEqual(splitItems("domates bir de peynir"), ["Domates", "Peynir"]);
});
