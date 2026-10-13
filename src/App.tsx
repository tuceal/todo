import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AddedSheet } from "./components/AddedSheet";
import { CategoryBar } from "./components/CategoryBar";
import { ComposeSheet } from "./components/ComposeSheet";
import { CartIcon, ChevronIcon, DotsIcon, MicIcon, TasksIcon, WandIcon } from "./components/Icons";
import { ShoppingList } from "./components/ShoppingList";
import { TaskCard } from "./components/TaskCard";
import { calendarUrl, daysFromToday, todayLabel } from "./dates";
import { makeTodo, sanitize, type ShopItem, type Todo, type TodoFields, useTodoStore } from "./store";
import { useBackClose } from "./useBackClose";
import { useInstallPrompt } from "./useInstallPrompt";

const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };
const UNDO_MS = 10_000;

function compare(a: Todo, b: Todo) {
  if ((a.dueDate ?? "") !== (b.dueDate ?? "")) return (a.dueDate ?? "9999") < (b.dueDate ?? "9999") ? -1 : 1;
  if ((a.time ?? "") !== (b.time ?? "")) return (a.time ?? "99") < (b.time ?? "99") ? -1 : 1;
  const p = (PRIORITY_WEIGHT[b.priority ?? ""] ?? 0) - (PRIORITY_WEIGHT[a.priority ?? ""] ?? 0);
  return p || b.createdAt - a.createdAt;
}

type Compose = { variant: "task" | "shop"; initial?: Todo; listen: boolean };
type Undo = { label: string; run: () => void };

export function App() {
  const { data, dispatch, exportBackup } = useTodoStore();
  const [tab, setTab] = useState<"tasks" | "shop">("tasks");
  const [filter, setFilter] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [compose, setCompose] = useState<Compose | null>(null);
  const [added, setAdded] = useState<Todo | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [showDone, setShowDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const install = useInstallPrompt();
  useBackClose(menuOpen, () => setMenuOpen(false));

  useEffect(() => {
    if (filter && !data.categories.includes(filter)) setFilter(null);
  }, [filter, data.categories]);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(t);
  }, [undo]);

  const scoped = useMemo(() => (filter ? data.todos.filter((t) => t.category === filter) : data.todos), [data.todos, filter]);
  const sections = useMemo(() => {
    const open = scoped.filter((t) => !t.done).sort(compare);
    const by = (fn: (t: Todo) => boolean) => open.filter(fn);
    return {
      overdue: by((t) => !!t.dueDate && daysFromToday(t.dueDate) < 0),
      today: by((t) => !!t.dueDate && daysFromToday(t.dueDate) === 0),
      upcoming: by((t) => !!t.dueDate && daysFromToday(t.dueDate) > 0),
      someday: by((t) => !t.dueDate),
      done: scoped.filter((t) => t.done).sort((a, b) => b.createdAt - a.createdAt),
    };
  }, [scoped]);
  const doneCount = sections.done.length;
  const total = scoped.length;
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of data.todos) if (t.category && !t.done) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, [data.todos]);

  const removeTodo = (todo: Todo) => {
    const index = data.todos.findIndex((t) => t.id === todo.id);
    dispatch({ type: "remove", id: todo.id });
    setUndo({ label: `"${todo.text}" silindi`, run: () => dispatch({ type: "restore", todo, index }) });
  };
  const removeShop = (item: ShopItem) => {
    const index = data.shopping.findIndex((s) => s.id === item.id);
    dispatch({ type: "shopRemove", id: item.id });
    setUndo({ label: `"${item.text}" silindi`, run: () => dispatch({ type: "shopRestore", item, index }) });
  };

  const openCalendar = (todoId: string, f: Pick<TodoFields, "text" | "dueDate" | "time">) => {
    if (!f.dueDate) return;
    window.open(calendarUrl(f.text, f.dueDate, f.time), "_blank", "noopener");
    dispatch({ type: "update", id: todoId, fields: { inCalendar: true } });
  };

  const saveTask = (fields: TodoFields) => {
    if (compose?.initial) {
      dispatch({ type: "update", id: compose.initial.id, fields });
      setCompose(null);
      return;
    }
    const todo = makeTodo({ ...fields, category: fields.category ?? filter ?? undefined });
    dispatch({ type: "add", todo });
    setCompose(null);
    if (todo.dueDate) setAdded(todo);
  };

  const importBackup = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setMenuOpen(false);
    if (!file) return;
    try {
      const incoming = sanitize(JSON.parse(await file.text()));
      if (
        confirm(
          `${incoming.todos.length} görev, ${incoming.shopping.length} alışveriş ürünü ve ${incoming.categories.length} kategori içe aktarılacak. ` +
            "Mevcut liste bunlarla DEĞİŞTİRİLECEK. Devam edilsin mi?",
        )
      ) {
        dispatch({ type: "replace", data: incoming });
        setFilter(null);
      }
    } catch {
      alert("Dosya okunamadı. Bu uygulamadan alınmış bir yedek (.json) seçtiğinden emin ol.");
    }
  };

  const card = (t: Todo) => (
    <TaskCard
      key={t.id}
      todo={t}
      categories={data.categories}
      showCategory={!filter}
      onToggle={() => dispatch({ type: "toggle", id: t.id })}
      onOpen={() => setCompose({ variant: "task", initial: t, listen: false })}
      onDelete={() => removeTodo(t)}
    />
  );
  const section = (title: string, list: Todo[], tone = "") =>
    list.length > 0 && (
      <section className="section">
        <h2 className={tone}>
          {title}
          <small>{list.length}</small>
        </h2>
        <div className="cards">{list.map(card)}</div>
      </section>
    );

  const shopLeft = data.shopping.filter((s) => !s.done).length;
  const shopBought = data.shopping.length - shopLeft;

  return (
    <div className={`app tab-${tab}`}>
      <div className="blob one" aria-hidden />
      <div className="blob two" aria-hidden />

      <header>
        <div className="brand-row">
          <span className="brand">
            <WandIcon size={18} />
            To-Do Magic
            <span className="brand-date">· {todayLabel()}</span>
          </span>
          <div className="menu-wrap">
            <button className="icon-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menü" aria-expanded={menuOpen}>
              <DotsIcon size={22} />
            </button>
            {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}
            {menuOpen && (
              <div className="menu" role="menu">
                {install && (
                  <button className="menu-install" onClick={() => (setMenuOpen(false), install())}>
                    Uygulamayı yükle
                  </button>
                )}
                <button onClick={() => (exportBackup(), setMenuOpen(false))}>Yedeği indir</button>
                <button onClick={() => fileRef.current?.click()}>Yedekten geri yükle</button>
                <button
                  disabled={!data.todos.some((t) => t.done)}
                  onClick={() => {
                    if (confirm("Tamamlanan tüm görevler silinsin mi?")) dispatch({ type: "clearDone" });
                    setMenuOpen(false);
                  }}
                >
                  Tamamlanan görevleri temizle
                </button>
                <p className="menu-note">Veriler sadece bu cihazda saklanır. Arada bir yedek al.</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
          </div>
        </div>

        {tab === "tasks" ? (
          <>
            <div className="title-row">
              <h1>Bugün ne var?</h1>
              <div className="progress-ring" style={{ ["--p" as string]: `${total ? (doneCount / total) * 100 : 0}%` }} role="img" aria-label={`${total} görevden ${doneCount} tamam`}>
                <span>
                  {doneCount}/{total}
                </span>
              </div>
            </div>
            <CategoryBar
              categories={data.categories}
              active={filter}
              counts={counts}
              onSelect={setFilter}
              onAdd={(name) => dispatch({ type: "addCategory", name })}
              onRemove={(name) => dispatch({ type: "removeCategory", name })}
            />
          </>
        ) : (
          <div className="title-row paper-head">
            <div>
              <h1 className="hand">Alışveriş</h1>
              <p className="sub">
                {data.shopping.length} ürün · {shopBought} alındı
              </p>
            </div>
            <button className="pill-btn" disabled={!shopBought} onClick={() => dispatch({ type: "shopClearDone" })}>
              Aldıklarımı sil
            </button>
          </div>
        )}
      </header>

      <main>
        {tab === "tasks" ? (
          <>
            {total === sections.done.length && (
              <div className="empty">
                <WandIcon size={40} />
                <p>{total ? "Hepsi bitti, sihir gibi!" : "Henüz görev yok."}</p>
                <p className="hint">Mikrofona dokun ve söyle: "yarın saat 4'te toplantı"</p>
              </div>
            )}
            {section("Gecikmiş", sections.overdue, "late")}
            {section("Bugün", sections.today)}
            {section("Yaklaşan", sections.upcoming)}
            {section("Tarihsiz", sections.someday)}
            {sections.done.length > 0 && (
              <section className="section">
                <button className="done-toggle" onClick={() => setShowDone((s) => !s)} aria-expanded={showDone}>
                  Tamamlanan <small>{sections.done.length}</small>
                  <ChevronIcon size={18} style={{ transform: showDone ? "rotate(180deg)" : undefined }} />
                </button>
                {showDone && <div className="cards">{sections.done.map(card)}</div>}
              </section>
            )}
          </>
        ) : (
          <ShoppingList
            items={data.shopping}
            onAdd={(texts) => dispatch({ type: "shopAdd", texts })}
            onToggle={(id) => dispatch({ type: "shopToggle", id })}
            onDelete={removeShop}
          />
        )}
      </main>

      {undo && (
        <div className="toast" role="status">
          <span>{undo.label}</span>
          <button onClick={() => (undo.run(), setUndo(null))}>Geri al</button>
        </div>
      )}

      <nav className="bottom-bar" aria-label="Bölümler">
        <button className={tab === "tasks" ? "on" : ""} onClick={() => setTab("tasks")} aria-current={tab === "tasks" ? "page" : undefined}>
          <TasksIcon size={22} />
          Görevler
        </button>
        <button
          className="fab"
          onClick={() => setCompose({ variant: tab === "tasks" ? "task" : "shop", listen: true })}
          aria-label={tab === "tasks" ? "Sesle görev ekle" : "Sesle ürün ekle"}
        >
          <MicIcon size={34} />
        </button>
        <button className={tab === "shop" ? "on" : ""} onClick={() => setTab("shop")} aria-current={tab === "shop" ? "page" : undefined}>
          <CartIcon size={22} />
          Alışveriş
          {shopLeft > 0 && tab !== "shop" && <span className="badge">{shopLeft}</span>}
        </button>
      </nav>

      {compose && (
        <ComposeSheet
          variant={compose.variant}
          initial={compose.initial}
          categories={data.categories}
          listenOnOpen={compose.listen}
          onSave={saveTask}
          onSaveItems={(texts) => (dispatch({ type: "shopAdd", texts }), setCompose(null))}
          onDelete={() => {
            if (compose.initial) removeTodo(compose.initial);
            setCompose(null);
          }}
          onCalendar={(f) => compose.initial && openCalendar(compose.initial.id, f)}
          onClose={() => setCompose(null)}
        />
      )}

      {added && (
        <AddedSheet
          todo={added}
          onCalendar={() => {
            openCalendar(added.id, added);
            setAdded(null);
          }}
          onClose={() => setAdded(null)}
        />
      )}
    </div>
  );
}
