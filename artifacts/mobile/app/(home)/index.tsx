import React, { useCallback, useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { AddTodoBar } from "@/components/AddTodoBar";
import { CategoryBar } from "@/components/CategoryBar";
import { ProgressBar } from "@/components/ProgressBar";
import { TodoItem } from "@/components/TodoItem";
import { Todo, Priority, useTodos } from "@/context/TodoContext";
import { useColors } from "@/hooks/useColors";

const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const {
    todos,
    activeFilter,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    setDueDate,
    setPriority,
    syncing,
  } = useTodos();

  const filtered = useMemo(
    () => (activeFilter ? todos.filter((t) => t.category === activeFilter) : todos),
    [todos, activeFilter]
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const pa = PRIORITY_WEIGHT[a.priority ?? ""] ?? 0;
        const pb = PRIORITY_WEIGHT[b.priority ?? ""] ?? 0;
        return pb - pa;
      }),
    [filtered]
  );

  const done = useMemo(() => filtered.filter((t) => t.done).length, [filtered]);
  const total = filtered.length;
  const progress = total === 0 ? 0 : (done / total) * 100;

  const handleToggle = useCallback((id: string) => toggleTodo(id), [toggleTodo]);
  const handleDelete = useCallback((id: string) => deleteTodo(id), [deleteTodo]);
  const handleEdit = useCallback((id: string, text: string) => editTodo(id, text), [editTodo]);
  const handleSetDueDate = useCallback((id: string, date: string | undefined) => setDueDate(id, date), [setDueDate]);
  const handleSetPriority = useCallback((id: string, p: Priority | undefined) => setPriority(id, p), [setPriority]);

  const topPad = Platform.OS === "web" ? 80 : insets.top + 16;

  const renderItem = useCallback(
    ({ item }: { item: Todo }) => (
      <TodoItem
        todo={item}
        onToggle={() => handleToggle(item.id)}
        onDelete={() => handleDelete(item.id)}
        onEdit={(text) => handleEdit(item.id, text)}
        onSetDueDate={(date) => handleSetDueDate(item.id, date)}
        onSetPriority={(p) => handleSetPriority(item.id, p)}
      />
    ),
    [handleToggle, handleDelete, handleEdit, handleSetDueDate, handleSetPriority]
  );

  const keyExtractor = useCallback((item: Todo) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View style={styles.header}>
        {/* User row */}
        <View style={styles.userRow}>
          <Text style={[styles.userGreet, { color: colors.mutedForeground }]}>
            {user?.firstName ? `Merhaba, ${user.firstName}` : "Merhaba"}
          </Text>
          <TouchableOpacity
            onPress={() => signOut()}
            activeOpacity={0.7}
            style={styles.signOutBtn}
          >
            <Feather name="log-out" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: colors.darkText }]}>Yapılacaklar</Text>
        <Text style={[styles.subtitle, { color: colors.lightText }]}>
          {done} / {total} tamamlandı
          {activeFilter ? `  ·  ${activeFilter}` : ""}
          {syncing ? "  · ●" : ""}
        </Text>
        <ProgressBar progress={progress} />
        <CategoryBar />
      </View>
    ),
    [done, total, progress, activeFilter, colors, user, syncing]
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
        data={sorted}
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
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  userGreet: {
    fontSize: 13,
    fontFamily: "Lato_300Light",
  },
  signOutBtn: {
    padding: 6,
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
