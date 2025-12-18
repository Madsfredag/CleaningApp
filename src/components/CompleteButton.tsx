import {
  TouchableOpacity,
  StyleSheet,
  Modal,
  View,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import Bubble from "./Bubble";

const { width } = Dimensions.get("window");

type Props = {
  completed: boolean;
  onToggleComplete: () => void;
};

export default function CompleteButton({ completed, onToggleComplete }: Props) {
  const [visible, setVisible] = useState(false);
  const [seed, setSeed] = useState(0);

  const handlePress = () => {
    if (!completed) {
      setSeed(Date.now()); // force new randomness
      setVisible(true);
      setTimeout(() => setVisible(false), 2300);
    }
    onToggleComplete();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View pointerEvents="none" style={styles.overlay}>
          {Array.from({ length: 15 }).map((_, i) => (
            <Bubble
              key={`${seed}-${i}`}
              startX={Math.random() * (width - 60)}
              drift={(Math.random() - 0.5) * 200}
              duration={1800 + Math.random() * 500}
            />
          ))}
        </View>
      </Modal>

      <TouchableOpacity onPress={handlePress} style={styles.checkbox}>
        <Ionicons
          name={completed ? "checkmark-circle" : "ellipse-outline"}
          size={30}
          color={completed ? "#28a745" : "#4e4c4cff"}
        />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  checkbox: {
    padding: 0,
    marginRight: 12,
  },
});
