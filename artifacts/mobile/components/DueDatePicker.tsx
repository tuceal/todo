import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

function parseCustomDate(input: string): string | null {
  const trimmed = input.trim();
  // DD.MM.YYYY
  const m1 = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m1) {
    const d = new Date(parseInt(m1[3]), parseInt(m1[2]) - 1, parseInt(m1[1]));
    if (!isNaN(d.getTime())) return toDateStr(d);
  }
  // YYYY-MM-DD (ISO)
  const m2 = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) {
    const d = new Date(trimmed + "T00:00:00");
    if (!isNaN(d.getTime())) return trimmed;
  }
  return null;
}

const PRESETS = [
  { label: "Bugün", value: () => addDays(0) },
  { label: "Yarın", value: () => addDays(1) },
  { label: "Bu hafta", value: () => addDays(7) },
  { label: "2 hafta", value: () => addDays(14) },
];

interface ChipProps {
  label: string;
  sublabel?: string;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
}

function Chip({ label, sublabel, active, danger, onPress }: ChipProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          borderColor: danger ? "#e53e3e" : active ? colors.gold : colors.border,
          backgroundColor: active ? colors.gold + "22" : "transparent",
        },
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          { color: danger ? "#e53e3e" : active ? colors.gold : colors.darkText },
        ]}
      >
        {label}
      </Text>
      {sublabel ? (
        <Text style={[styles.chipSub, { color: active ? colors.gold : colors.mutedForeground }]}>
          {sublabel}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

interface Props {
  currentDate?: string;
  onSelect: (date: string | undefined) => void;
}

export function DueDatePicker({ currentDate, onSelect }: Props) {
  const colors = useColors();
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState(false);

  const presetValues = PRESETS.map((p) => p.value());
  const isCustomDate = !!currentDate && !presetValues.includes(currentDate);

  const handleCustomSubmit = () => {
    const parsed = parseCustomDate(customInput);
    if (parsed) {
      onSelect(parsed);
      setCustomInput("");
      setCustomError(false);
      setShowCustom(false);
    } else {
      setCustomError(true);
    }
  };

  const handleCustomChange = (text: string) => {
    setCustomInput(text);
    setCustomError(false);
  };

  return (
    <View style={styles.wrapper}>
      {/* Horizontal chip row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {PRESETS.map((p) => {
          const val = p.value();
          return (
            <Chip
              key={p.label}
              label={p.label}
              sublabel={formatDateTR(val)}
              active={currentDate === val}
              onPress={() => {
                onSelect(val);
                setShowCustom(false);
              }}
            />
          );
        })}

        {/* Custom date chip */}
        <Chip
          label={isCustomDate ? formatDateTR(currentDate!) : "Özel"}
          sublabel={isCustomDate ? undefined : undefined}
          active={showCustom || isCustomDate}
          onPress={() => {
            setShowCustom((v) => !v);
            setCustomInput(isCustomDate ? currentDate! : "");
            setCustomError(false);
          }}
        />

        {/* Clear chip */}
        {currentDate && (
          <Chip
            label="Sil"
            danger
            onPress={() => {
              onSelect(undefined);
              setShowCustom(false);
              setCustomInput("");
            }}
          />
        )}
      </ScrollView>

      {/* Custom date input — shown when Özel chip is active */}
      {showCustom && (
        <View style={[styles.customRow, { borderColor: customError ? "#e53e3e" : colors.border }]}>
          {Platform.OS === "web" ? (
            // Native browser date picker on web
            <View style={styles.webDateWrap}>
              {/* @ts-ignore */}
              <input
                type="date"
                defaultValue={isCustomDate ? currentDate : ""}
                onChange={(e: any) => {
                  const v = e.target.value;
                  if (v) {
                    onSelect(v);
                    setShowCustom(false);
                  }
                }}
                style={{
                  fontFamily: "inherit",
                  fontSize: 13,
                  color: colors.darkText,
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  padding: 0,
                  cursor: "pointer",
                  width: "100%",
                }}
              />
            </View>
          ) : (
            <>
              <Feather name="calendar" size={13} color={colors.mutedForeground} />
              <TextInput
                style={[styles.customInput, { color: colors.darkText }]}
                placeholder="GG.AA.YYYY"
                placeholderTextColor={colors.mutedForeground}
                value={customInput}
                onChangeText={handleCustomChange}
                keyboardType="numeric"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleCustomSubmit}
                autoFocus
              />
              <TouchableOpacity onPress={handleCustomSubmit} activeOpacity={0.7}>
                <Feather name="check" size={15} color={customError ? "#e53e3e" : colors.gold} />
              </TouchableOpacity>
            </>
          )}
          {customError && (
            <Text style={styles.errorText}>Geçersiz tarih</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  chipSub: {
    fontSize: 10,
    fontFamily: "Lato_400Regular",
    marginTop: 1,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  webDateWrap: {
    flex: 1,
  },
  customInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    padding: 0,
  },
  errorText: {
    fontSize: 11,
    color: "#e53e3e",
    fontFamily: "Lato_400Regular",
    marginTop: 2,
  },
});
