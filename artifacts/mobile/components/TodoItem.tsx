import * as Haptics from "expo-haptics";
import React, { memo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Todo, Priority } from "@/context/TodoContext";
import { DueDatePicker, formatDateTR, dueDateStatus } from "@/components/DueDatePicker";

const SWIPE_THRESHOLD = 90;
const DELETE_THRESHOLD = 130;

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "#e53e3e",
  medium: "#d97706",
  low: "#60a5fa",
};

const PRIORITY_CYCLE: (Priority | undefined)[] = [undefined, "high", "medium", "low"];

function nextPriority(current?: Priority): Priority | undefined {
  const idx = PRIORITY_CYCLE.indexOf(current);
  return PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
}

interface Props {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
  onSetDueDate: (date: string | undefined) => void;
  onSetPriority: (priority: Priority | undefined) => void;
}

function dueDateLabel(dateStr: string): string {
  const status = dueDateStatus(dateStr);
  if (status === "today") return "Bugün";
  if (status === "overdue") return `${formatDateTR(dateStr)} · Gecikti`;
  return formatDateTR(dateStr);
}

function dueDateColor(dateStr: string, colors: ReturnType<typeof import("@/hooks/useColors").useColors>): string {
  const status = dueDateStatus(dateStr);
  if (status === "overdue") return "#e53e3e";
  if (status === "today") return colors.gold;
  return colors.mutedForeground;
}

function TodoItemInner({ todo, onToggle, onDelete, onEdit, onSetDueDate, onSetPriority }: Props) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const deleteOpacity = translateX.interpolate({
    inputRange: [-DELETE_THRESHOLD, -SWIPE_THRESHOLD, 0],
    outputRange: [1, 0.6, 0],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Platform.OS !== "web" && !editing && Math.abs(dx) > Math.abs(dy) && dx < -8,
      onPanResponderMove: (_, { dx }) => {
        if (dx < 0) translateX.setValue(Math.max(dx, -DELETE_THRESHOLD - 20));
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -DELETE_THRESHOLD) {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Animated.timing(translateX, {
            toValue: -500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDelete());
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  const handleToggle = () => {
    if (editing) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 70, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 4 }),
    ]).start();
    onToggle();
  };

  const handleWebDelete = () => {
    if (Platform.OS !== "web") return;
    Animated.timing(translateX, {
      toValue: -500,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onDelete());
  };

  const handleCyclePriority = () => {
    const next = nextPriority(todo.priority);
    onSetPriority(next);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const startEdit = () => {
    setEditText(todo.text);
    setEditing(true);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const saveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      onEdit(trimmed);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditText(todo.text);
    setEditing(false);
  };

  const priorityColor = todo.priority ? PRIORITY_COLORS[todo.priority] : colors.border;
  const hasPriority = !!todo.priority;

  return (
    <View style={styles.wrapper}>
      {Platform.OS !== "web" && (
        <Animated.View
          style={[
            styles.deleteBackground,
            { backgroundColor: colors.micActive, opacity: deleteOpacity },
          ]}
        >
          <Feather name="trash-2" size={18} color="#fff" />
        </Animated.View>
      )}

      <Animated.View
        style={[{ transform: [{ translateX }, { scale: scaleAnim }] }]}
        {...(Platform.OS !== "web" ? panResponder.panHandlers : {})}
      >
        <View
          style={[
            styles.container,
            { borderBottomColor: colors.border, backgroundColor: colors.cream },
          ]}
        >
          {/* Priority dot — tap to cycle */}
          <TouchableOpacity
            onPress={handleCyclePriority}
            activeOpacity={0.7}
            style={styles.priorityBtn}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <View
              style={[
                styles.priorityDot,
                {
                  backgroundColor: hasPriority ? priorityColor : "transparent",
                  borderColor: hasPriority ? priorityColor : colors.border,
                },
              ]}
            />
          </TouchableOpacity>

          {/* Check button */}
          <TouchableOpacity
            onPress={handleToggle}
            activeOpacity={0.8}
            style={[
              styles.checkBtn,
              {
                borderColor: colors.gold,
                backgroundColor: todo.done ? colors.gold : "transparent",
              },
            ]}
          >
            {todo.done && <Feather name="check" size={13} color="#fff" />}
          </TouchableOpacity>

          {/* Text or edit input */}
          {editing ? (
            <View style={styles.editWrap}>
              <TextInput
                style={[
                  styles.editInput,
                  { color: colors.darkText, borderBottomColor: colors.gold },
                ]}
                value={editText}
                onChangeText={setEditText}
                onSubmitEditing={saveEdit}
                autoFocus
                returnKeyType="done"
                blurOnSubmit
                multiline={false}
              />
              <TouchableOpacity
                style={styles.dateRow}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Feather
                  name="calendar"
                  size={13}
                  color={todo.dueDate ? colors.gold : colors.mutedForeground}
                />
                <Text style={[styles.dateRowText, { color: todo.dueDate ? colors.gold : colors.mutedForeground }]}>
                  {todo.dueDate ? dueDateLabel(todo.dueDate) : "Tarih ekle"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.textWrap}>
              <Text
                style={[
                  styles.text,
                  {
                    color: todo.done ? colors.strikethrough : colors.darkText,
                    textDecorationLine: todo.done ? "line-through" : "none",
                  },
                ]}
                numberOfLines={3}
              >
                {todo.text}
              </Text>
              <View style={styles.metaRow}>
                {todo.category ? (
                  <Text style={[styles.metaLabel, { color: colors.gold }]}>{todo.category}</Text>
                ) : null}
                {todo.dueDate ? (
                  <Text style={[styles.metaLabel, { color: dueDateColor(todo.dueDate, colors) }]}>
                    {todo.category ? "  ·  " : ""}
                    <Feather name="calendar" size={10} />
                    {"  " + dueDateLabel(todo.dueDate)}
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {editing ? (
              <>
                <TouchableOpacity onPress={saveEdit} activeOpacity={0.7} style={styles.actionBtn}>
                  <Feather name="check" size={16} color={colors.gold} />
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelEdit} activeOpacity={0.7} style={styles.actionBtn}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={startEdit} activeOpacity={0.7} style={styles.actionBtn}>
                  <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
                {Platform.OS === "web" && (
                  <TouchableOpacity onPress={handleWebDelete} activeOpacity={0.7} style={styles.actionBtn}>
                    <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Animated.View>

      <DueDatePicker
        visible={showDatePicker}
        currentDate={todo.dueDate}
        onSelect={(date) => onSetDueDate(date)}
        onClose={() => setShowDatePicker(false)}
      />
    </View>
  );
}

export const TodoItem = memo(TodoItemInner);

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    overflow: "hidden",
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  priorityBtn: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  checkBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "Lato_400Regular",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: "Lato_400Regular",
    letterSpacing: 0.3,
  },
  editWrap: {
    flex: 1,
    gap: 6,
  },
  editInput: {
    fontSize: 16,
    fontFamily: "Lato_400Regular",
    borderBottomWidth: 1.5,
    paddingVertical: 2,
    paddingHorizontal: 0,
    lineHeight: 22,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 2,
  },
  dateRowText: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  actionBtn: {
    padding: 6,
  },
});
