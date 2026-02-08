import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import TaskColorPicker from "../components/TaskColorPicker";
import { DEFAULT_TASK_COLOR } from "../utils/taskColors";
import i18n from "../translations/i18n";

export default function ChooseColorScreen() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (user?.taskColor) {
      setSelected(user.taskColor);
    }
  }, [user]);

  const saveColor = async (color: string) => {
    if (!user) return;
    try {
      setSelected(color);
      await updateDoc(doc(db, "users", user.id), {
        taskColor: color,
      });
    } catch {
      Alert.alert("Error", "Could not save color");
    }
  };

  return (
    <LinearGradient colors={["#acbdacff", "#4d4f4fff"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{i18n.t("choose_your_color")}</Text>
        <Text style={styles.subtitle}>{i18n.t("color_used_on_tasks")}</Text>

        <TaskColorPicker
          selected={selected ?? DEFAULT_TASK_COLOR}
          onSelect={saveColor}
        />

        {!user?.taskColor ? (
          <Text style={styles.hint}>{i18n.t("change_later_in_profile")}</Text>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2b2d42",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginTop: 8,
    textAlign: "center",
  },
  hint: {
    fontSize: 12,
    color: "#fffdfdff",
    marginTop: 16,
    fontStyle: "italic",
  },
});
