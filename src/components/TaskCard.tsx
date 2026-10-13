import { categoryColor } from "../categories";
import { daysFromToday, formatDue } from "../dates";
import type { Todo } from "../store";
import { CalendarCheckIcon, CalendarIcon, CheckIcon, FlagIcon, categoryIcon } from "./Icons";
import { SwipeRow } from "./SwipeRow";

const PRIORITY_LABEL = { high: "Yüksek", medium: "Orta", low: "Düşük" } as const;

function dueTone(t: Todo) {
  if (!t.dueDate || t.done) return "muted";
  const d = daysFromToday(t.dueDate);
  if (d < 0) return "overdue";
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  return "later";
}

interface Props {
  todo: Todo;
  categories: string[];
  showCategory: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
}

export function TaskCard({ todo, categories, showCategory, onToggle, onOpen, onDelete }: Props) {
  const CatIcon = todo.category ? categoryIcon(todo.category) : null;
  const cat = todo.category ? categoryColor(todo.category, categories) : null;
  return (
    <SwipeRow onDelete={onDelete}>
      <div className={`card${todo.done ? " done" : ""}`}>
        <button
          className={`ring prio-${todo.priority ?? "none"}${todo.done ? " checked" : ""}`}
          onClick={onToggle}
          aria-label={todo.done ? "Tamamlanmadı yap" : "Tamamla"}
        >
          {todo.done && <CheckIcon size={14} strokeWidth={3} />}
        </button>
        <button className="card-body" onClick={onOpen} aria-label={`${todo.text}, düzenle`}>
          <span className="card-title">{todo.text}</span>
          {!todo.done && (todo.dueDate || todo.priority || (showCategory && todo.category)) && (
            <span className="meta">
              {todo.dueDate && (
                <span className={`meta-item tone-${dueTone(todo)}`}>
                  <CalendarIcon size={14} />
                  {formatDue(todo.dueDate, todo.time)}
                </span>
              )}
              {todo.priority && (
                <span className={`meta-item flag-${todo.priority}`}>
                  <FlagIcon size={14} />
                  {PRIORITY_LABEL[todo.priority]}
                </span>
              )}
              {showCategory && CatIcon && cat && (
                <span className="meta-item" style={{ color: cat.fg }}>
                  <CatIcon size={14} />
                  {todo.category}
                </span>
              )}
              {todo.inCalendar && (
                <span className="meta-item tone-muted">
                  <CalendarCheckIcon size={14} />
                  Takvimde
                </span>
              )}
            </span>
          )}
        </button>
      </div>
    </SwipeRow>
  );
}
