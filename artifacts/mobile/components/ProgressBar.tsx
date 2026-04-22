import React from "react";
import { StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  progress: number;
}

export function ProgressBar({ progress }: Props) {
  const colors = useColors();
  const clampedWidth = `${Math.max(0, Math.min(100, progress))}%` as const;

  return (
    <View style={[styles.track, { backgroundColor: colors.muted }]}>
      <View
        style={[
          styles.fill,
          {
            width: clampedWidth,
            backgroundColor: colors.gold,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 10,
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
});
