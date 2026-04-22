import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
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

function playSoftBeep(type: "start" | "stop") {
  if (Platform.OS !== "web") return;
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = type === "start" ? 523 : 392;
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.07);
    setTimeout(() => { try { ctx.close(); } catch {} }, 500);
  } catch {}
}

export function AddTodoBar({ onAdd }: Props) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const recRef = useRef<any>(null);

  const startPulse = useCallback(() => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const handleAdd = useCallback(() => {
    if (!text.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onAdd(text);
    setText("");
  }, [text, onAdd]);

  const handleMic = useCallback(() => {
    if (Platform.OS !== "web") {
      if (listening) {
        Haptics.selectionAsync();
        setListening(false);
        stopPulse();
      } else {
        Haptics.selectionAsync();
        setListening(true);
        startPulse();
        setTimeout(() => {
          setListening(false);
          stopPulse();
        }, 3000);
      }
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      if (listening) {
        try { recRef.current?.stop(); } catch {}
        playSoftBeep("stop");
        setListening(false);
        stopPulse();
        return;
      }

      const rec = new SpeechRecognition();
      rec.lang = "tr-TR";
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        try { setText(e.results[0][0].transcript); } catch {}
        playSoftBeep("stop");
        setListening(false);
        stopPulse();
      };
      rec.onerror = () => { setListening(false); stopPulse(); };
      rec.onend = () => { setListening(false); stopPulse(); };
      recRef.current = rec;
      playSoftBeep("start");
      rec.start();
      setListening(true);
      startPulse();
    } catch {
      setListening(false);
      stopPulse();
    }
  }, [listening, startPulse, stopPulse]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.white, borderColor: colors.border },
      ]}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Yeni görev ekle..."
        placeholderTextColor={colors.mutedForeground}
        onSubmitEditing={handleAdd}
        returnKeyType="done"
        style={[styles.input, { color: colors.darkText, fontFamily: "Lato_400Regular" }]}
      />

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handleMic}
          activeOpacity={0.8}
          style={[
            styles.iconBtn,
            { backgroundColor: listening ? colors.micActive : colors.secondary },
          ]}
        >
          <Feather name="mic" size={16} color={listening ? "#fff" : colors.gold} />
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        onPress={handleAdd}
        activeOpacity={0.8}
        style={[styles.iconBtn, { backgroundColor: colors.darkText }]}
      >
        <Feather name="plus" size={20} color="#fff" />
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
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    minWidth: 0,
    paddingVertical: Platform.OS === "ios" ? 6 : 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
