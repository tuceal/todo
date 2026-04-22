import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  onAdd: (text: string) => void;
}

export function AddTodoBar({ onAdd }: Props) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onAdd(text);
    setText("");
  };

  const handleMic = () => {
    if (Platform.OS === "web") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Tarayıcınız ses tanımayı desteklemiyor.");
        return;
      }
      if (listening) {
        setListening(false);
        stopPulse();
        return;
      }
      const rec = new SpeechRecognition();
      rec.lang = "tr-TR";
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setText(transcript);
        setListening(false);
        stopPulse();
      };
      rec.onerror = () => { setListening(false); stopPulse(); };
      rec.onend = () => { setListening(false); stopPulse(); };
      rec.start();
      setListening(true);
      startPulse();
    } else {
      if (listening) {
        setListening(false);
        stopPulse();
      } else {
        setListening(true);
        startPulse();
        setTimeout(() => {
          setListening(false);
          stopPulse();
        }, 3000);
      }
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.white,
          borderColor: colors.border,
          shadowColor: "#000",
        },
      ]}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Yeni görev ekle..."
        placeholderTextColor={colors.mutedForeground}
        onSubmitEditing={handleAdd}
        returnKeyType="done"
        style={[
          styles.input,
          { color: colors.darkText, fontFamily: "Lato_400Regular" },
        ]}
      />

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handleMic}
          activeOpacity={0.8}
          style={[
            styles.micBtn,
            {
              backgroundColor: listening ? colors.micActive : colors.secondary,
            },
          ]}
        >
          <Feather
            name="mic"
            size={16}
            color={listening ? "#ffffff" : colors.gold}
          />
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        onPress={handleAdd}
        activeOpacity={0.8}
        style={[styles.addBtn, { backgroundColor: colors.darkText }]}
      >
        <Feather name="plus" size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 8,
    paddingLeft: 18,
    paddingRight: 8,
    borderWidth: 1,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    minWidth: 0,
    paddingVertical: Platform.OS === "ios" ? 6 : 4,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
