import React from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateTR(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]}`;
}

export function dueDateStatus(dateStr: string): "overdue" | "today" | "soon" | "future" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 3) return "soon";
  return "future";
}

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

interface Option {
  label: string;
  sublabel?: string;
  value: string | null;
  danger?: boolean;
}

interface Props {
  visible: boolean;
  currentDate?: string;
  onSelect: (date: string | undefined) => void;
  onClose: () => void;
}

export function DueDatePicker({ visible, currentDate, onSelect, onClose }: Props) {
  const colors = useColors();

  const options: Option[] = [
    { label: "Bugün", sublabel: formatDateTR(addDays(0)), value: addDays(0) },
    { label: "Yarın", sublabel: formatDateTR(addDays(1)), value: addDays(1) },
    { label: "Bu hafta", sublabel: formatDateTR(addDays(7)), value: addDays(7) },
    { label: "2 hafta sonra", sublabel: formatDateTR(addDays(14)), value: addDays(14) },
    ...(currentDate ? [{ label: "Tarihi sil", value: null, danger: true }] : []),
  ];

  const handleSelect = (value: string | null) => {
    onSelect(value ?? undefined);
    onClose();
  };

  if (Platform.OS === "web") {
    if (!visible) return null;
    return (
      <View style={[styles.webOverlay]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.webBackdrop} />
        </TouchableWithoutFeedback>
        <View style={[styles.webCard, { backgroundColor: colors.cream, shadowColor: colors.darkText }]}>
          <Text style={[styles.title, { color: colors.darkText }]}>Bitiş tarihi</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.option, { borderBottomColor: colors.border }]}
              onPress={() => handleSelect(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionLabel, { color: opt.danger ? "#e53e3e" : colors.darkText }]}>
                {opt.label}
              </Text>
              {opt.sublabel && (
                <Text style={[styles.optionSub, { color: colors.mutedForeground }]}>{opt.sublabel}</Text>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={[styles.cancelLabel, { color: colors.mutedForeground }]}>İptal</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={[styles.sheet, { backgroundColor: colors.cream }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text style={[styles.title, { color: colors.darkText }]}>Bitiş tarihi</Text>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.option, { borderBottomColor: colors.border }]}
            onPress={() => handleSelect(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionLabel, { color: opt.danger ? "#e53e3e" : colors.darkText }]}>
              {opt.label}
            </Text>
            {opt.sublabel && (
              <Text style={[styles.optionSub, { color: colors.mutedForeground }]}>{opt.sublabel}</Text>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={[styles.cancelLabel, { color: colors.mutedForeground }]}>İptal</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    opacity: 0.5,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: "Lato_400Regular",
  },
  optionSub: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  cancelBtn: {
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelLabel: {
    fontSize: 15,
    fontFamily: "Lato_400Regular",
  },
  webOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  webBackdrop: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  webCard: {
    width: 300,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
  },
});
