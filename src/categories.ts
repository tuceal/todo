// Kategori renkleri sırayla atanır; metin rengi zemine göre ≥4.5:1 kontrastlı
const PALETTE = [
  { bg: "#EEEAFC", fg: "#4B3BB0" },
  { bg: "#DDF2EE", fg: "#106A61" },
  { bg: "#FCE5EE", fg: "#A62B5C" },
  { bg: "#E6F0FB", fg: "#245FA8" },
  { bg: "#FBF0D9", fg: "#8A5A00" },
  { bg: "#EAF4E1", fg: "#3D6B1F" },
];

export function categoryColor(name: string, categories: string[]) {
  const i = categories.indexOf(name);
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
}
