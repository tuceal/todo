import { useCallback, useEffect, useReducer } from "react";

export type Priority = "high" | "medium" | "low";

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  category?: string;
  /** Yerel tarih, YYYY-MM-DD */
  dueDate?: string;
  /** Yerel saat, HH:MM (sadece dueDate varken anlamlı) */
  time?: string;
  priority?: Priority;
  /** Kullanıcı "Takvime ekle"ye bastı */
  inCalendar?: boolean;
}

export interface ShopItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface Data {
  todos: Todo[];
  categories: string[];
  shopping: ShopItem[];
}

export type TodoFields = Pick<Todo, "text" | "category" | "dueDate" | "time" | "priority">;

// v3 aynı anahtarı kullanır; yeni alanlar (time, shopping…) eski kayıtlara zararsızca eklenir
export const STORAGE_KEY = "yapilacaklar:v2";
/** Eski adresten yeni adrese taşınırken veri bu hash ile gelir */
export const TRANSFER_HASH = "#tasi=";
// Eski Expo web sürümünün AsyncStorage anahtarları (aynı adreste açılırsa bir kez içe alınır)
const LEGACY_TODOS_KEY = "@yapilacaklar_todos_v2";
const LEGACY_CATS_KEY = "@yapilacaklar_categories";

type Action =
  | { type: "add"; todo: Todo }
  | { type: "update"; id: string; fields: Partial<Todo> }
  | { type: "toggle"; id: string }
  | { type: "remove"; id: string }
  | { type: "restore"; todo: Todo; index: number }
  | { type: "clearDone" }
  | { type: "addCategory"; name: string }
  | { type: "removeCategory"; name: string }
  | { type: "shopAdd"; texts: string[] }
  | { type: "shopToggle"; id: string }
  | { type: "shopRemove"; id: string }
  | { type: "shopRestore"; item: ShopItem; index: number }
  | { type: "shopClearDone" }
  | { type: "replace"; data: Data };

export function genId() {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function insertAt<T>(list: T[], item: T, index: number) {
  const next = [...list];
  next.splice(Math.min(index, next.length), 0, item);
  return next;
}

function reducer(state: Data, a: Action): Data {
  switch (a.type) {
    case "add":
      return a.todo.text ? { ...state, todos: [a.todo, ...state.todos] } : state;
    case "update":
      return {
        ...state,
        todos: state.todos.map((t) => {
          if (t.id !== a.id) return t;
          const next = { ...t, ...a.fields };
          next.text = next.text.trim() || t.text;
          if (!next.dueDate) delete next.time;
          // Tarih/saat değiştiyse eski takvim kaydı artık geçerli değil
          if (next.dueDate !== t.dueDate || next.time !== t.time) delete next.inCalendar;
          return next;
        }),
      };
    case "toggle":
      return { ...state, todos: state.todos.map((t) => (t.id === a.id ? { ...t, done: !t.done } : t)) };
    case "remove":
      return { ...state, todos: state.todos.filter((t) => t.id !== a.id) };
    case "restore":
      return { ...state, todos: insertAt(state.todos, a.todo, a.index) };
    case "clearDone":
      return { ...state, todos: state.todos.filter((t) => !t.done) };
    case "addCategory": {
      const name = a.name.trim();
      if (!name || state.categories.some((c) => c.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr"))) return state;
      return { ...state, categories: [...state.categories, name] };
    }
    case "removeCategory":
      return {
        ...state,
        categories: state.categories.filter((c) => c !== a.name),
        todos: state.todos.map((t) => (t.category === a.name ? { ...t, category: undefined } : t)),
      };
    case "shopAdd": {
      const now = Date.now();
      const items = a.texts
        .map((t) => t.trim())
        .filter(Boolean)
        .map((text, i) => ({ id: genId(), text, done: false, createdAt: now + i }));
      return items.length ? { ...state, shopping: [...state.shopping, ...items] } : state;
    }
    case "shopToggle":
      return { ...state, shopping: state.shopping.map((s) => (s.id === a.id ? { ...s, done: !s.done } : s)) };
    case "shopRemove":
      return { ...state, shopping: state.shopping.filter((s) => s.id !== a.id) };
    case "shopRestore":
      return { ...state, shopping: insertAt(state.shopping, a.item, a.index) };
    case "shopClearDone":
      return { ...state, shopping: state.shopping.filter((s) => !s.done) };
    case "replace":
      return a.data;
  }
}

export function makeTodo(fields: TodoFields): Todo {
  const todo: Todo = { ...fields, text: fields.text.trim(), id: genId(), done: false, createdAt: Date.now() };
  if (!todo.dueDate) delete todo.time;
  for (const k of Object.keys(todo) as (keyof Todo)[]) if (todo[k] === undefined) delete todo[k];
  return todo;
}

const isStr = (v: unknown): v is string => typeof v === "string";

/** Dışarıdan gelen (yedek dosyası, eski sürüm) veriyi doğrular; bozuk kayıtları atar. */
export function sanitize(raw: unknown): Data {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
  return {
    categories: [...new Set((Array.isArray(obj.categories) ? obj.categories : []).filter((c): c is string => isStr(c) && c.trim() !== ""))],
    todos: list(obj.todos)
      .filter((t) => t && isStr(t.id) && isStr(t.text))
      .map((t) => ({
        id: t.id as string,
        text: t.text as string,
        done: !!t.done,
        createdAt: Number(t.createdAt) || Date.now(),
        category: isStr(t.category) ? t.category : undefined,
        dueDate: isStr(t.dueDate) ? t.dueDate.slice(0, 10) : undefined,
        time: isStr(t.time) && /^\d{2}:\d{2}$/.test(t.time) ? t.time : undefined,
        priority: ["high", "medium", "low"].includes(t.priority as string) ? (t.priority as Priority) : undefined,
        inCalendar: t.inCalendar === true || undefined,
      })),
    shopping: list(obj.shopping)
      .filter((s) => s && isStr(s.id) && isStr(s.text))
      .map((s) => ({ id: s.id as string, text: s.text as string, done: !!s.done, createdAt: Number(s.createdAt) || Date.now() })),
  };
}

const isEmpty = (d: Data) => d.todos.length === 0 && d.shopping.length === 0;

/** Eski adresten gelen veriyi al; bu cihazda zaten liste varsa ona dokunma. */
function takeTransfer(): Data | null {
  if (!location.hash.startsWith(TRANSFER_HASH)) return null;
  const raw = decodeURIComponent(location.hash.slice(TRANSFER_HASH.length));
  history.replaceState(null, "", location.pathname + location.search);
  try {
    const incoming = sanitize(JSON.parse(raw));
    const current = localStorage.getItem(STORAGE_KEY);
    if (current && !isEmpty(sanitize(JSON.parse(current)))) return null;
    return incoming;
  } catch {
    return null;
  }
}

function load(): Data {
  const transferred = takeTransfer();
  if (transferred) return transferred;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitize(JSON.parse(raw));
    const legacyTodos = localStorage.getItem(LEGACY_TODOS_KEY);
    if (legacyTodos) {
      return sanitize({
        todos: JSON.parse(legacyTodos),
        categories: JSON.parse(localStorage.getItem(LEGACY_CATS_KEY) ?? "[]"),
      });
    }
  } catch {
    // Bozuk veri: boş listeyle başla, eski kaydın üstüne yazmadan önce yedeğini al
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) localStorage.setItem(`${STORAGE_KEY}:corrupt:${Date.now()}`, raw);
  }
  return { todos: [], categories: [], shopping: [] };
}

export function useTodoStore() {
  const [data, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Depolama dolu veya kapalı (ör. gizli sekme) — uygulama bellekte çalışmaya devam eder
    }
  }, [data]);

  useEffect(() => {
    // Tarayıcıdan verinin kendiliğinden silinmemesini iste
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  const exportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify({ app: "to-do-magic", version: 3, ...data }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `to-do-magic-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [data]);

  return { data, dispatch, exportBackup };
}
