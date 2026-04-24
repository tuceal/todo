import React, { useCallback, useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddTodoBar } from "@/components/AddTodoBar";
import { CategoryBar } from "@/components/CategoryBar";
import { ProgressBar } from "@/components/ProgressBar";
import { TodoItem } from "@/components/TodoItem";
import { Todo, useTodos } from "@/context/TodoContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todos, activeFilter, addTodo, toggleTodo, deleteTodo, editTodo, setDueDate } = useTodos();

  const filtered = useMemo(
    () => (activeFilter ? todos.filter((t) => t.category === activeFilter) : todos),
    [todos, activeFilter]
  );

  const done = useMemo(() => filtered.filter((t) => t.done).length, [filtered]);
  const total = useMemo(() => filtered.length, [filtered]);
  const progress = total === 0 ? 0 : (done / total) * 100;

  const handleToggle = useCallback((id: string) => toggleTodo(id), [toggleTodo]);
  const handleDelete = useCallback((id: string) => deleteTodo(id), [deleteTodo]);
  const handleEdit = useCallback((id: string, text: string) => editTodo(id, text), [editTodo]);
  const handleSetDueDate = useCallback((id: string, date: string | undefined) => setDueDate(id, date), [setDueDate]);

  const topPad = Platform.OS === "web" ? 80 : insets.top + 16;

  const renderItem = useCallback(
    ({ item }: { item: Todo }) => (
      <TodoItem
        todo={item}
        onToggle={() => handleToggle(item.id)}
        onDelete={() => handleDelete(item.id)}
        onEdit={(text) => handleEdit(item.id, text)}
        onSetDueDate={(date) => handleSetDueDate(item.id, date)}
      />
    ),
    [handleToggle, handleDelete, handleEdit, handleSetDueDate]
  );

  const keyExtractor = useCallback((item: Todo) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.darkText }]}>Yapılacaklar</Text>
        <Text style={[styles.subtitle, { color: colors.lightText }]}>
          {done} / {total} tamamlandı
          {activeFilter ? `  ·  ${activeFilter}` : ""}
        </Text>
        <ProgressBar progress={progress} />
        <CategoryBar />
      </View>
    ),
    [done, total, progress, activeFilter, colors]
  );

  const ListEmpty = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Henüz görev yok.
        </Text>
        <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
          Aşağıdan bir şeyler ekle!
        </Text>
      </View>
    ),
    [colors]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.cream }]}>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: topPad,
            paddingBottom: Platform.OS === "web" ? 140 : insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        windowSize={10}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
      />

      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16),
            paddingHorizontal: 20,
            paddingTop: 12,
            backgroundColor: colors.cream,
          },
        ]}
      >
        <AddTodoBar onAdd={addTodo} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 24 },
  header: { marginBottom: 8 },
  title: {
    fontSize: 38,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: -1,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Lato_300Light",
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 4,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Lato_400Regular",
    fontStyle: "italic",
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: "Lato_300Light",
    fontStyle: "italic",
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
