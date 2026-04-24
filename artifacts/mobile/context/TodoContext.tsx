import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

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

const initialTodos: Todo[] = [
  { id: "1", text: "Yapılacaklar uygulamasını keşfet", done: true, createdAt: Date.now() - 200000 },
  { id: "2", text: "İlk görevini ekle", done: false, createdAt: Date.now() - 100000 },
];

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(TODOS_KEY),
      AsyncStorage.getItem(CATS_KEY),
    ]).then(([rawTodos, rawCats]) => {
      if (rawTodos) {
        try { setTodos(JSON.parse(rawTodos)); } catch {}
      }
      if (rawCats) {
        try { setCategories(JSON.parse(rawCats)); } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  }, [todos, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(CATS_KEY, JSON.stringify(categories));
  }, [categories, loaded]);

  const addTodo = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      {
        id: genId(),
        text: trimmed,
        done: false,
        createdAt: Date.now(),
        category: activeFilter ?? undefined,
      },
      ...prev,
    ]);
  };

  const toggleTodo = (id: string) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTodo = (id: string) =>
    setTodos((prev) => prev.filter((t) => t.id !== id));

  const editTodo = (id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: trimmed } : t)));
  };

  const setDueDate = (id: string, date: string | undefined) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, dueDate: date } : t)));

  const setPriority = (id: string, priority: Priority | undefined) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));

  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories((prev) => [...prev, trimmed]);
  };

  const deleteCategory = (name: string) => {
    setCategories((prev) => prev.filter((c) => c !== name));
    setTodos((prev) => prev.map((t) => t.category === name ? { ...t, category: undefined } : t));
    if (activeFilter === name) setActiveFilter(null);
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        categories,
        activeFilter,
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
