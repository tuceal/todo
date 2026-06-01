import * as Haptics from "expo-haptics";
import React, { memo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useTodos } from "@/context/TodoContext";

function CategoryBarInner() {
  const colors = useColors();
  const { categories, activeFilter, setActiveFilter, addCategory, deleteCategory } = useTodos();
  const [modalVisible, setModalVisible] = useState(false);
  const [newCatText, setNewCatText] = useState("");

  const handleSelect = (cat: string | null) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setActiveFilter(cat);
  };

  const handleAdd = () => {
    const trimmed = newCatText.trim();
    if (trimmed) {
      addCategory(trimmed);
      setActiveFilter(trimmed);
    }
    setNewCatText("");
    setModalVisible(false);
  };

  const handleDeleteCategory = (cat: string) => {
    if (Platform.OS === "web") {
      if (window.confirm(`"${cat}" silinsin mi?\nBu kategorideki görevler kategorisiz kalacak.`)) {
        deleteCategory(cat);
      }
      return;
    }
    Alert.alert(
      `"${cat}" silinsin mi?`,
      "Bu kategorideki görevler kategorisiz kalacak.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => deleteCategory(cat),
        },
      ]
    );
  };

  const allActive = activeFilter === null;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scroll}
      >
        {/* "All" chip */}
        <TouchableOpacity
          onPress={() => handleSelect(null)}
          activeOpacity={0.75}
          style={[
            styles.chip,
            {
              backgroundColor: allActive ? colors.gold : colors.secondary,
              borderColor: allActive ? colors.gold : colors.border,
            },
          ]}
        >
          <Text style={[styles.chipText, { color: allActive ? "#fff" : colors.darkText }]}>
            Tümü
          </Text>
        </TouchableOpacity>

        {/* Category chips */}
        {categories.map((cat) => {
          const isActive = activeFilter === cat;
          return (
            <View key={cat} style={styles.chipWrap}>
              <TouchableOpacity
                onPress={() => handleSelect(cat)}
                activeOpacity={0.75}
                style={[
                  styles.chip,
                  styles.chipWithX,
                  {
                    backgroundColor: isActive ? colors.gold : colors.secondary,
                    borderColor: isActive ? colors.gold : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: isActive ? "#fff" : colors.darkText }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteCategory(cat)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                style={[styles.chipX, { backgroundColor: isActive ? colors.goldDark : colors.muted }]}
              >
                <Feather name="x" size={9} color={isActive ? "#fff" : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add chip */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.75}
          style={[styles.chip, styles.addChip, { borderColor: colors.border }]}
        >
          <Feather name="plus" size={13} color={colors.gold} />
          <Text style={[styles.chipText, { color: colors.gold }]}>Ekle</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: colors.white }]}>
            <Text style={[styles.modalTitle, { color: colors.darkText }]}>
              Yeni Kategori
            </Text>
            <TextInput
              value={newCatText}
              onChangeText={setNewCatText}
              placeholder="Kategori adı..."
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              style={[
                styles.modalInput,
                {
                  color: colors.darkText,
                  borderColor: colors.border,
                  fontFamily: "Lato_400Regular",
                },
              ]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => { setNewCatText(""); setModalVisible(false); }}
                style={[styles.modalBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>
                  İptal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdd}
                style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.gold }]}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export const CategoryBar = memo(CategoryBarInner);

const styles = StyleSheet.create({
  scroll: {
    marginTop: 16,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  chipWrap: {
    position: "relative",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipWithX: {
    paddingRight: 22,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  chipX: {
    position: "absolute",
    right: 5,
    top: "50%",
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addChip: {
    backgroundColor: "transparent",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalBox: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "PlayfairDisplay_700Bold",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  modalBtnPrimary: {
    borderWidth: 0,
  },
  modalBtnText: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
});
