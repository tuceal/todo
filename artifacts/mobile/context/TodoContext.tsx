import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type Priority = "high" | "medium" | "low";

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  category?: string;
  dueDate?: string;
  priority?: Priority;
}

interface TodoContextValue {
  todos: Todo[];
  categories: string[];
  activeFilter: string | null;
  syncing: boolean;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  editTodo: (id: string, text: string) => void;
  setDueDate: (id: string, date: string | undefined) => void;
  setPriority: (id: string, priority: Priority | undefined) => void;
  addCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  setActiveFilter: (cat: string | null) => void;
}

const TodoContext = createContext<TodoContextValue | null>(null);

const TODOS_KEY = "@yapilacaklar_todos_v2";
const CATS_KEY = "@yapilacaklar_categories";
const MIGRATION_PREFIX = "@yapilacaklar_migrated_";

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

async function apiFetch(
  path: string,
  getToken: () => Promise<string | null>,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getToken();
  return fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

// Serialize API row → Todo (handles snake_case → camelCase)
function rowToTodo(row: any): Todo {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    createdAt: Number(row.createdAt ?? row.created_at),
    category: row.category ?? undefined,
    dueDate: row.dueDate ?? row.due_date ?? undefined,
    priority: row.priority ?? undefined,
  };
}

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken, userId } = useAuth();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // AsyncStorage fallback (when not signed in)
  const saveLocal = useCallback(
    async (nextTodos: Todo[], nextCats: string[]) => {
      await Promise.all([
        AsyncStorage.setItem(TODOS_KEY, JSON.stringify(nextTodos)),
        AsyncStorage.setItem(CATS_KEY, JSON.stringify(nextCats)),
      ]);
    },
    [],
  );

  // ── Load data based on auth state ──────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && userId) {
      loadFromAPI(userId);
    } else if (!isSignedIn) {
      loadFromStorage();
    }
  }, [isLoaded, isSignedIn, userId]);

  const loadFromStorage = async () => {
    const [rawTodos, rawCats] = await Promise.all([
      AsyncStorage.getItem(TODOS_KEY),
      AsyncStorage.getItem(CATS_KEY),
    ]);
    if (rawTodos) { try { setTodos(JSON.parse(rawTodos)); } catch {} }
    if (rawCats) { try { setCategories(JSON.parse(rawCats)); } catch {} }
  };

  const loadFromAPI = async (uid: string) => {
    setSyncing(true);
    try {
      const [todosRes, catsRes] = await Promise.all([
        apiFetch("/api/todos", getToken),
        apiFetch("/api/categories", getToken),
      ]);

      if (!todosRes.ok || !catsRes.ok) throw new Error("API error");

      const apiTodos: Todo[] = (await todosRes.json()).map(rowToTodo);
      const apiCats: string[] = await catsRes.json();

      // Migration: if API is empty, check local storage
      if (apiTodos.length === 0) {
        const migKey = MIGRATION_PREFIX + uid;
        const migrated = await AsyncStorage.getItem(migKey);
        if (!migrated) {
          await migrateToCloud(uid);
          // Reload after migration
          const [tr2, cr2] = await Promise.all([
            apiFetch("/api/todos", getToken),
            apiFetch("/api/categories", getToken),
          ]);
          const migratedTodos: Todo[] = (await tr2.json()).map(rowToTodo);
          const migratedCats: string[] = await cr2.json();
          setTodos(migratedTodos);
          setCategories(migratedCats);
          return;
        }
      } else {
        // API has data — mark as migrated
        await AsyncStorage.setItem(MIGRATION_PREFIX + uid, "1");
      }

      setTodos(apiTodos);
      setCategories(apiCats);
    } catch (err) {
      console.error("Failed to load from API, falling back to local", err);
      await loadFromStorage();
    } finally {
      setSyncing(false);
    }
  };

  const migrateToCloud = async (uid: string) => {
    const [rawTodos, rawCats] = await Promise.all([
      AsyncStorage.getItem(TODOS_KEY),
      AsyncStorage.getItem(CATS_KEY),
    ]);
    const localTodos: Todo[] = rawTodos ? JSON.parse(rawTodos) : [];
    const localCats: string[] = rawCats ? JSON.parse(rawCats) : [];

    await Promise.all([
      ...localTodos.map((t) =>
        apiFetch("/api/todos", getToken, {
          method: "POST",
          body: JSON.stringify(t),
        }),
      ),
      ...localCats.map((name) =>
        apiFetch("/api/categories", getToken, {
          method: "POST",
          body: JSON.stringify({ name }),
        }),
      ),
    ]);

    await AsyncStorage.setItem(MIGRATION_PREFIX + uid, "1");
  };

  // ── CRUD ────────────────────────────────────────────────────────

  const addTodo = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const todo: Todo = {
        id: genId(),
        text: trimmed,
        done: false,
        createdAt: Date.now(),
        category: activeFilter ?? undefined,
      };
      setTodos((prev) => [todo, ...prev]);

      if (isSignedIn) {
        apiFetch("/api/todos", getToken, {
          method: "POST",
          body: JSON.stringify(todo),
        }).catch(console.error);
      } else {
        setTodos((prev) => {
          const next = [todo, ...prev.filter((t) => t.id !== todo.id)];
          saveLocal(next, categories);
          return next;
        });
      }
    },
    [isSignedIn, getToken, activeFilter, categories, saveLocal],
  );

  const toggleTodo = useCallback(
    (id: string) => {
      setTodos((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, done: !t.done } : t,
        );
        if (!isSignedIn) saveLocal(next, categories);
        return next;
      });
      if (isSignedIn) {
        setTodos((prev) => {
          const todo = prev.find((t) => t.id === id);
          if (todo) {
            apiFetch(`/api/todos/${id}`, getToken, {
              method: "PUT",
              body: JSON.stringify({ done: !todo.done }),
            }).catch(console.error);
          }
          return prev;
        });
      }
    },
    [isSignedIn, getToken, categories, saveLocal],
  );

  const deleteTodo = useCallback(
    (id: string) => {
      setTodos((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (!isSignedIn) saveLocal(next, categories);
        return next;
      });
      if (isSignedIn) {
        apiFetch(`/api/todos/${id}`, getToken, { method: "DELETE" }).catch(
          console.error,
        );
      }
    },
    [isSignedIn, getToken, categories, saveLocal],
  );

  const editTodo = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setTodos((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, text: trimmed } : t,
        );
        if (!isSignedIn) saveLocal(next, categories);
        return next;
      });
      if (isSignedIn) {
        apiFetch(`/api/todos/${id}`, getToken, {
          method: "PUT",
          body: JSON.stringify({ text: trimmed }),
        }).catch(console.error);
      }
    },
    [isSignedIn, getToken, categories, saveLocal],
  );

  const setDueDate = useCallback(
    (id: string, date: string | undefined) => {
      setTodos((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, dueDate: date } : t,
        );
        if (!isSignedIn) saveLocal(next, categories);
        return next;
      });
      if (isSignedIn) {
        apiFetch(`/api/todos/${id}`, getToken, {
          method: "PUT",
          body: JSON.stringify({ dueDate: date ?? null }),
        }).catch(console.error);
      }
    },
    [isSignedIn, getToken, categories, saveLocal],
  );

  const setPriority = useCallback(
    (id: string, priority: Priority | undefined) => {
      setTodos((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, priority } : t,
        );
        if (!isSignedIn) saveLocal(next, categories);
        return next;
      });
      if (isSignedIn) {
        apiFetch(`/api/todos/${id}`, getToken, {
          method: "PUT",
          body: JSON.stringify({ priority: priority ?? null }),
        }).catch(console.error);
      }
    },
    [isSignedIn, getToken, categories, saveLocal],
  );

  const addCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || categories.includes(trimmed)) return;
      const next = [...categories, trimmed];
      setCategories(next);
      if (isSignedIn) {
        apiFetch("/api/categories", getToken, {
          method: "POST",
          body: JSON.stringify({ name: trimmed }),
        }).catch(console.error);
      } else {
        saveLocal(todos, next);
      }
    },
    [isSignedIn, getToken, categories, todos, saveLocal],
  );

  const deleteCategory = useCallback(
    (name: string) => {
      const nextCats = categories.filter((c) => c !== name);
      const nextTodos = todos.map((t) =>
        t.category === name ? { ...t, category: undefined } : t,
      );
      setCategories(nextCats);
      setTodos(nextTodos);
      if (activeFilter === name) setActiveFilter(null);

      if (isSignedIn) {
        apiFetch(`/api/categories/${encodeURIComponent(name)}`, getToken, {
          method: "DELETE",
        }).catch(console.error);
        // Update todos that had this category
        nextTodos
          .filter((t) => !t.category && todos.find((o) => o.id === t.id)?.category === name)
          .forEach((t) =>
            apiFetch(`/api/todos/${t.id}`, getToken, {
              method: "PUT",
              body: JSON.stringify({ category: null }),
            }).catch(console.error),
          );
      } else {
        saveLocal(nextTodos, nextCats);
      }
    },
    [isSignedIn, getToken, categories, todos, activeFilter, saveLocal],
  );

  return (
    <TodoContext.Provider
      value={{
        todos,
        categories,
        activeFilter,
        syncing,
        addTodo,
        toggleTodo,
        deleteTodo,
        editTodo,
        setDueDate,
        setPriority,
        addCategory,
        deleteCategory,
        setActiveFilter,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

export function useTodos() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodos must be used within TodoProvider");
  return ctx;
}
