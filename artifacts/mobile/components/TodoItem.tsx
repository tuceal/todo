import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Todo } from "@/context/TodoContext";

interface Props {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}

export function TodoItem({ todo, onToggle, onDelete }: Props) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  const handleDelete = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      onDelete();
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { borderBottomColor: colors.border, opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.8}
        style={[
          styles.checkBtn,
          {
            borderColor: todo.done ? colors.gold : colors.gold,
            backgroundColor: todo.done ? colors.gold : "transparent",
          },
        ]}
      >
        {todo.done && (
          <Feather name="check" size={13} color="#ffffff" />
        )}
      </TouchableOpacity>

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

      <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={styles.deleteBtn}>
        <Feather name="x" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 14,
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
  text: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "Lato_400Regular",
  },
  deleteBtn: {
    padding: 4,
    flexShrink: 0,
  },
});
