import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AddBar } from "./components/AddBar";
import { CategoryBar } from "./components/CategoryBar";
import { TodoItem } from "./components/TodoItem";
import { daysFromToday } from "./dates";
import { sanitize, type Todo, useTodoStore } from "./store";
import { useBackClose } from "./useBackClose";
import { useInstallPrompt } from "./useInstallPrompt";

const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

function compare(a: Todo, b: Todo) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const p = (PRIORITY_WEIGHT[b.priority ?? ""] ?? 0) - (PRIORITY_WEIGHT[a.priority ?? ""] ?? 0);
  if (p) return p;
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return b.createdAt - a.createdAt;
}

export function App() {
  const { data, dispatch, exportBackup } = useTodoStore();
  const [filter, setFilter] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [undo, setUndo] = useState<{ todo: Todo; index: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const install = useInstallPrompt();
  useBackClose(menuOpen, () => setMenuOpen(false));

  // Silinen kategori seçili kaldıysa filtreyi sıfırla
  useEffect(() => {
    if (filter && !data.categories.includes(filter)) setFilter(null);
  }, [filter, data.categories]);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 5000);
    return () => clearTimeout(t);
  }, [undo]);

  const visible = useMemo(
    () => (filter ? data.todos.filter((t) => t.category === filter) : data.todos).slice().sort(compare),
    [data.todos, filter],
  );
  const done = visible.filter((t) => t.done).length;
  const overdue = visible.filter((t) => !t.done && t.dueDate && daysFromToday(t.dueDate) < 0).length;
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of data.todos) if (t.category && !t.done) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, [data.todos]);

  const remove = (todo: Todo) => {
    setUndo({ todo, index: data.todos.findIndex((t) => t.id === todo.id) });
    dispatch({ type: "remove", id: todo.id });
  };

  const importBackup = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const incoming = sanitize(JSON.parse(await file.text()));
      if (
        confirm(
          `${incoming.todos.length} görev ve ${incoming.categories.length} kategori içe aktarılacak. ` +
            "Mevcut liste bunlarla DEĞİŞTİRİLECEK. Devam edilsin mi?",
        )
      ) {
        dispatch({ type: "replace", data: incoming });
        setFilter(null);
      }
    } catch {
      alert("Dosya okunamadı. Bu uygulamadan alınmış bir yedek (.json) seçtiğinden emin ol.");
    }
    setMenuOpen(false);
  };

  return (
    <div className="app">
      <header>
        <div className="title-row">
          <h1>Yapılacaklar</h1>
          <div className="menu-wrap">
            <button className="icon-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menü" aria-expanded={menuOpen}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}
            {menuOpen && (
              <div className="menu" role="menu">
                {install && (
                  <button
                    className="menu-install"
                    onClick={() => {
                      setMenuOpen(false);
                      install();
                    }}
                  >
                    Uygulamayı yükle
                  </button>
                )}
                <button
                  onClick={() => {
                    exportBackup();
                    setMenuOpen(false);
                  }}
                >
                  Yedeği indir
                </button>
                <button onClick={() => fileRef.current?.click()}>Yedekten geri yükle</button>
                <button
                  disabled={!data.todos.some((t) => t.done)}
                  onClick={() => {
                    if (confirm("Tamamlanan tüm görevler silinsin mi?")) dispatch({ type: "clearDone" });
                    setMenuOpen(false);
                  }}
                >
                  Tamamlananları temizle
                </button>
                <p className="menu-note">Veriler sadece bu cihazda saklanır. Arada bir yedek almanı öneririm.</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
          </div>
        </div>
        <p className="subtitle">
          {done} / {visible.length} tamamlandı
          {overdue > 0 && <span className="overdue-count"> · {overdue} gecikmiş</span>}
        </p>
        <div className="progress" aria-hidden>
          <div style={{ width: `${visible.length ? (done / visible.length) * 100 : 0}%` }} />
        </div>
        <CategoryBar
          categories={data.categories}
          active={filter}
          counts={counts}
          onSelect={setFilter}
          onAdd={(name) => dispatch({ type: "addCategory", name })}
          onRemove={(name) => dispatch({ type: "removeCategory", name })}
        />
      </header>

      <main>
        {visible.length === 0 ? (
          <div className="empty">
            <p>Henüz görev yok.</p>
            <p>Aşağıdan bir şeyler ekle!</p>
          </div>
        ) : (
          <ul className="list">
            {visible.map((t) => (
              <TodoItem
                key={t.id}
                todo={t}
                showCategory={!filter}
                onToggle={() => dispatch({ type: "toggle", id: t.id })}
                onEdit={(text) => dispatch({ type: "edit", id: t.id, text })}
                onRemove={() => remove(t)}
                onDue={(dueDate) => dispatch({ type: "due", id: t.id, dueDate })}
                onPriority={(priority) => dispatch({ type: "priority", id: t.id, priority })}
              />
            ))}
          </ul>
        )}
      </main>

      <footer>
        {undo && (
          <div className="toast" role="status">
            <span>Görev silindi</span>
            <button
              onClick={() => {
                dispatch({ type: "restore", ...undo });
                setUndo(null);
              }}
            >
              Geri al
            </button>
          </div>
        )}
        <AddBar
          onAdd={(text) => dispatch({ type: "add", text, category: filter ?? undefined })}
          placeholder={filter ? `${filter} için yeni görev…` : "Yeni görev ekle…"}
        />
      </footer>
    </div>
  );
}
