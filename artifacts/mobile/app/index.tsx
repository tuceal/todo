import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddTodoBar } from "@/components/AddTodoBar";
import { ProgressBar } from "@/components/ProgressBar";
import { TodoItem } from "@/components/TodoItem";
import { useTodos } from "@/context/TodoContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();

  const done = useMemo(() => todos.filter((t) => t.done).length, [todos]);
  const total = useMemo(() => todos.length, [todos]);
  const progress = total === 0 ? 0 : (done / total) * 100;

  const topPad = Platform.OS === "web" ? 80 : insets.top + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.cream }]}>
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: topPad,
            paddingBottom: Platform.OS === "web" ? 140 : insets.bottom + 120,
          },
        ]}
        scrollEnabled={!!todos.length || true}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.darkText }]}>
              Yapılacaklar
            </Text>
            <Text style={[styles.subtitle, { color: colors.lightText }]}>
              {done} / {total} tamamlandı
            </Text>
            <ProgressBar progress={progress} />
          </View>
        }
        renderItem={({ item }) => (
          <TodoItem
            todo={item}
            onToggle={() => toggleTodo(item.id)}
            onDelete={() => deleteTodo(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Henüz görev yok.
            </Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
              Aşağıdan bir şeyler ekle!
            </Text>
          </View>
        }
      />

      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: Platform.OS === "web"
              ? 34
              : Math.max(insets.bottom, 16),
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
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 8,
  },
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
