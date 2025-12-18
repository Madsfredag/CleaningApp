import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { TASK_COLORS } from "../utils/taskColors";

type Props = {
  selected: string | null;
  onSelect: (color: string) => void;
};

export default function TaskColorPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {TASK_COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.circle,
            { backgroundColor: color },
            selected === color && styles.selected,
          ]}
          onPress={() => onSelect(color)}
          activeOpacity={0.8}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginVertical: 24,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  selected: {
    borderWidth: 3,
    borderColor: "#2b2d42",
  },
});
