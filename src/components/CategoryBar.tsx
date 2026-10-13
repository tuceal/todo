import { useRef, useState } from "react";
import { categoryColor } from "../categories";
import { XIcon, categoryIcon } from "./Icons";

interface Props {
  categories: string[];
  active: string | null;
  counts: Record<string, number>;
  onSelect: (c: string | null) => void;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}

export function CategoryBar({ categories, active, counts, onSelect, onAdd, onRemove }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const cancelled = useRef(false);

  const commit = () => {
    if (!cancelled.current && name.trim()) {
      onAdd(name);
      onSelect(name.trim());
    }
    cancelled.current = false;
    setName("");
    setAdding(false);
  };

  return (
    <div className="chips">
      <button className={`chip all${active === null ? " active" : ""}`} onClick={() => onSelect(null)}>
        Tümü
      </button>
      {categories.map((c) => {
        const Icon = categoryIcon(c);
        const col = categoryColor(c, categories);
        const on = active === c;
        return (
          <span key={c} className={`chip${on ? " active" : ""}`} style={on ? undefined : { background: col.bg, color: col.fg }}>
            <button className="chip-label" onClick={() => onSelect(on ? null : c)}>
              <Icon size={16} />
              {c}
              {counts[c] ? <small>{counts[c]}</small> : null}
            </button>
            {on && (
              <button
                className="chip-x"
                aria-label={`${c} kategorisini sil`}
                onClick={() => {
                  if (confirm(`"${c}" kategorisi silinsin mi? Görevler silinmez, kategorisiz kalır.`)) onRemove(c);
                }}
              >
                <XIcon size={14} />
              </button>
            )}
          </span>
        );
      })}
      {adding ? (
        <input
          className="chip chip-input"
          autoFocus
          value={name}
          placeholder="Kategori adı"
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancelled.current = true;
            if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
          }}
        />
      ) : (
        <button className="chip chip-add" onClick={() => setAdding(true)} aria-label="Kategori ekle">
          + Kategori
        </button>
      )}
    </div>
  );
}
