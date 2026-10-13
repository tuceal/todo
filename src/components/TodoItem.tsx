import { useState } from "react";
import { addDays, daysFromToday, formatDue } from "../dates";
import type { Priority, Todo } from "../store";

const PRIORITY_LABEL: Record<Priority, string> = { high: "Yüksek", medium: "Orta", low: "Düşük" };

interface Props {
  todo: Todo;
  showCategory: boolean;
  onToggle: () => void;
  onEdit: (text: string) => void;
  onRemove: () => void;
  onDue: (date?: string) => void;
  onPriority: (p?: Priority) => void;
}

export function TodoItem({ todo, showCategory, onToggle, onEdit, onRemove, onDue, onPriority }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  // Tek seferde tek seçici açık: öncelik ya da tarih
  const [picker, setPicker] = useState<"prio" | "due" | null>(null);
  const toggle = (which: "prio" | "due") => setPicker((p) => (p === which ? null : which));

  const saveEdit = () => {
    if (draft.trim() && draft !== todo.text) onEdit(draft);
    else setDraft(todo.text);
    setEditing(false);
  };

  const overdue = !todo.done && todo.dueDate && daysFromToday(todo.dueDate) < 0;
  const pickDue = (d?: string) => {
    onDue(d);
    setPicker(null);
  };
  const pickPriority = (p?: Priority) => {
    onPriority(p);
    setPicker(null);
  };

  return (
    <li className={`todo${todo.done ? " done" : ""}`}>
      <div className="todo-row">
        <button
          className={`check${todo.done ? " checked" : ""}`}
          onClick={onToggle}
          aria-label={todo.done ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"}
        >
          {todo.done && (
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
        </button>

        <div className="todo-body">
          {editing ? (
            <input
              className="edit-input"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") {
                  setDraft(todo.text);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <button
              className="todo-text"
              onClick={() => {
                if (todo.done) return;
                setDraft(todo.text);
                setEditing(true);
              }}
            >
              {todo.text}
            </button>
          )}
          <div className="meta">
            <button
              className={`pill prio prio-${todo.priority ?? "none"}`}
              onClick={() => toggle("prio")}
              aria-expanded={picker === "prio"}
            >
              <span className="dot" />
              {todo.priority ? PRIORITY_LABEL[todo.priority] : "Öncelik"}
            </button>
            <button className={`pill due${overdue ? " overdue" : ""}`} onClick={() => toggle("due")} aria-expanded={picker === "due"}>
              {todo.dueDate ? formatDue(todo.dueDate) : "Tarih"}
            </button>
            {showCategory && todo.category && <span className="pill cat">{todo.category}</span>}
          </div>
          {picker === "prio" && (
            <div className="picker">
              {(["high", "medium", "low"] as const).map((p) => (
                <button key={p} className={`prio-${p}${todo.priority === p ? " selected" : ""}`} onClick={() => pickPriority(p)}>
                  <span className="dot" />
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
              {todo.priority && (
                <button className="danger" onClick={() => pickPriority(undefined)}>
                  Kaldır
                </button>
              )}
            </div>
          )}
          {picker === "due" && (
            <div className="picker">
              <button onClick={() => pickDue(addDays(0))}>Bugün</button>
              <button onClick={() => pickDue(addDays(1))}>Yarın</button>
              <button onClick={() => pickDue(addDays(7))}>Haftaya</button>
              <input
                type="date"
                aria-label="Tarih seç"
                value={todo.dueDate ?? ""}
                onChange={(e) => pickDue(e.target.value || undefined)}
              />
              {todo.dueDate && (
                <button className="danger" onClick={() => pickDue(undefined)}>
                  Kaldır
                </button>
              )}
            </div>
          )}
        </div>

        <button className="icon-btn remove" onClick={onRemove} aria-label="Sil">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </li>
  );
}
