import { useState } from "react";

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

  const commit = () => {
    if (name.trim()) {
      onAdd(name);
      onSelect(name.trim());
    }
    setName("");
    setAdding(false);
  };

  return (
    <div className="chips" role="tablist">
      <button className={`chip${active === null ? " active" : ""}`} onClick={() => onSelect(null)}>
        Tümü
      </button>
      {categories.map((c) => (
        <span key={c} className={`chip${active === c ? " active" : ""}`}>
          <button className="chip-label" onClick={() => onSelect(c)}>
            {c}
            {counts[c] ? <small>{counts[c]}</small> : null}
          </button>
          {active === c && (
            <button
              className="chip-x"
              aria-label={`${c} kategorisini sil`}
              onClick={() => {
                if (confirm(`"${c}" kategorisi silinsin mi? Görevler silinmez, kategorisiz kalır.`)) onRemove(c);
              }}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {adding ? (
        <input
          className="chip chip-input"
          autoFocus
          value={name}
          placeholder="Kategori adı"
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setName("");
              setAdding(false);
            }
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
