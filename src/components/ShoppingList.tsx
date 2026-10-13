import { useState } from "react";
import { splitItems } from "../parse";
import type { ShopItem } from "../store";
import { CheckIcon } from "./Icons";
import { SwipeRow } from "./SwipeRow";

interface Props {
  items: ShopItem[];
  onAdd: (texts: string[]) => void;
  onToggle: (id: string) => void;
  onDelete: (item: ShopItem) => void;
}

export function ShoppingList({ items, onAdd, onToggle, onDelete }: Props) {
  const [draft, setDraft] = useState("");
  // Alınmamışlar üstte, alınanlar altta (eklenme sırasıyla)
  const sorted = [...items].sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt);

  const commit = () => {
    const texts = splitItems(draft);
    if (texts.length) onAdd(texts);
    setDraft("");
  };

  return (
    <ul className="paper-list">
      {sorted.map((s, i) => (
        <li key={s.id}>
          <SwipeRow onDelete={() => onDelete(s)}>
            <button className={`paper-row${s.done ? " bought" : ""}`} onClick={() => onToggle(s.id)} aria-pressed={s.done}>
              <span className="box" style={{ transform: `rotate(${[-3, 2, -1, 3, -2][i % 5]}deg)` }} aria-hidden>
                {s.done && <CheckIcon size={18} strokeWidth={3.2} />}
              </span>
              <span className="paper-text">{s.text}</span>
            </button>
          </SwipeRow>
        </li>
      ))}
      <li className="paper-add">
        <span className="box dashed" aria-hidden />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          onBlur={commit}
          placeholder="yaz ya da söyle…"
          aria-label="Listeye ekle"
          enterKeyHint="done"
        />
      </li>
    </ul>
  );
}
