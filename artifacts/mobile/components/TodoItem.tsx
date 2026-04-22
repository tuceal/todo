import * as Haptics from "expo-haptics";
import React, { memo, useRef } from "react";
import {
  Animated,
  Platform,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Todo } from "@/context/TodoContext";

const SWIPE_THRESHOLD = 90;
const DELETE_THRESHOLD = 130;

interface Props {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}

function TodoItemInner({ todo, onToggle, onDelete }: Props) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const deleteOpacity = translateX.interpolate({
    inputRange: [-DELETE_THRESHOLD, -SWIPE_THRESHOLD, 0],
    outputRange: [1, 0.6, 0],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Platform.OS !== "web" && Math.abs(dx) > Math.abs(dy) && dx < -8,
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

  return (
    <View style={styles.wrapper}>
      {/* Delete background (native swipe reveal) */}
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

          {/* Text + category label */}
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
            {todo.category ? (
              <Text style={[styles.catLabel, { color: colors.gold }]}>{todo.category}</Text>
            ) : null}
          </View>

          {/* Web-only delete button */}
          {Platform.OS === "web" && (
            <TouchableOpacity
              onPress={handleWebDelete}
              activeOpacity={0.7}
              style={styles.deleteBtn}
            >
              <Feather name="trash-2" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
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
  textWrap: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "Lato_400Regular",
  },
  catLabel: {
    fontSize: 11,
    fontFamily: "Lato_400Regular",
    letterSpacing: 0.3,
  },
  deleteBtn: {
    padding: 6,
    flexShrink: 0,
  },
});
