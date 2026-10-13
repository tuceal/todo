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
  priority?: Priority;
}

export interface Data {
  todos: Todo[];
  categories: string[];
}

const STORAGE_KEY = "yapilacaklar:v2";
// Eski Expo web sürümünün AsyncStorage anahtarları (aynı adreste açılırsa bir kez içe alınır)
const LEGACY_TODOS_KEY = "@yapilacaklar_todos_v2";
const LEGACY_CATS_KEY = "@yapilacaklar_categories";

type Action =
  | { type: "add"; text: string; category?: string }
  | { type: "toggle"; id: string }
  | { type: "edit"; id: string; text: string }
  | { type: "remove"; id: string }
  | { type: "restore"; todo: Todo; index: number }
  | { type: "due"; id: string; dueDate?: string }
  | { type: "priority"; id: string; priority?: Priority }
  | { type: "clearDone" }
  | { type: "addCategory"; name: string }
  | { type: "removeCategory"; name: string }
  | { type: "replace"; data: Data };

function genId() {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function patch(todos: Todo[], id: string, change: Partial<Todo>) {
  return todos.map((t) => (t.id === id ? { ...t, ...change } : t));
}

function reducer(state: Data, a: Action): Data {
  switch (a.type) {
    case "add": {
      const text = a.text.trim();
      if (!text) return state;
      const todo: Todo = { id: genId(), text, done: false, createdAt: Date.now(), category: a.category };
      return { ...state, todos: [todo, ...state.todos] };
    }
    case "toggle": {
      const t = state.todos.find((x) => x.id === a.id);
      return t ? { ...state, todos: patch(state.todos, a.id, { done: !t.done }) } : state;
    }
    case "edit": {
      const text = a.text.trim();
      return text ? { ...state, todos: patch(state.todos, a.id, { text }) } : state;
    }
    case "remove":
      return { ...state, todos: state.todos.filter((t) => t.id !== a.id) };
    case "restore": {
      const todos = [...state.todos];
      todos.splice(Math.min(a.index, todos.length), 0, a.todo);
      return { ...state, todos };
    }
    case "due":
      return { ...state, todos: patch(state.todos, a.id, { dueDate: a.dueDate }) };
    case "priority":
      return { ...state, todos: patch(state.todos, a.id, { priority: a.priority }) };
    case "clearDone":
      return { ...state, todos: state.todos.filter((t) => !t.done) };
    case "addCategory": {
      const name = a.name.trim();
      if (!name || state.categories.includes(name)) return state;
      return { ...state, categories: [...state.categories, name] };
    }
    case "removeCategory":
      return {
        categories: state.categories.filter((c) => c !== a.name),
        todos: state.todos.map((t) => (t.category === a.name ? { ...t, category: undefined } : t)),
      };
    case "replace":
      return a.data;
  }
}

/** Dışarıdan gelen (yedek dosyası, eski sürüm) veriyi doğrular; bozuk kayıtları atar. */
export function sanitize(raw: unknown): Data {
  const obj = (raw ?? {}) as Partial<Record<keyof Data, unknown>>;
  const todos = Array.isArray(obj.todos) ? obj.todos : [];
  const categories = Array.isArray(obj.categories) ? obj.categories : [];
  return {
    categories: [...new Set(categories.filter((c): c is string => typeof c === "string" && c.trim() !== ""))],
    todos: todos
      .filter((t): t is Todo => !!t && typeof t.id === "string" && typeof t.text === "string")
      .map((t) => ({
        id: t.id,
        text: t.text,
        done: !!t.done,
        createdAt: Number(t.createdAt) || Date.now(),
        category: typeof t.category === "string" ? t.category : undefined,
        dueDate: typeof t.dueDate === "string" ? t.dueDate.slice(0, 10) : undefined,
        priority: ["high", "medium", "low"].includes(t.priority as string) ? t.priority : undefined,
      })),
  };
}

function load(): Data {
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
  return { todos: [], categories: [] };
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
    // Tarayıcıdan verinin kendiliğinden silinmemesini iste (Safari/Chrome izin verirse)
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  const exportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify({ app: "yapilacaklar", version: 2, ...data }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yapilacaklar-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [data]);

  return { data, dispatch, exportBackup };
}
