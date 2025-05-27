import React from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { Task } from "../types/Task";
import { AppUser } from "../types/User";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../translations/i18n";
interface Props {
  visible: boolean;
  onClose: () => void;
  task: Task;
  assignedUser: AppUser | null;
}

export default function TaskDetailsModal({
  visible,
  onClose,
  task,
  assignedUser,
}: Props) {
  const dueDate = (
    task.dueDate instanceof Date ? task.dueDate : (task.dueDate as any).toDate()
  ).toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{task.title}</Text>

          <Text style={styles.label}>{i18n.t("assigned_to")}:</Text>
          <Text style={styles.value}>
            {assignedUser?.displayName || i18n.t("unassigned")}
          </Text>

          <Text style={styles.label}>{i18n.t("due_date")}:</Text>
          <Text style={styles.value}>{dueDate}</Text>

          <Text style={styles.label}>{i18n.t("details")}:</Text>
          <Text style={styles.value}>
            {task.details?.trim() ? task.details : i18n.t("no_details")}
          </Text>

          <Text style={styles.label}>{i18n.t("repeat")}:</Text>
          <Text style={styles.value}>
            {task.repeat
              ? `${task.repeat.interval} × ${i18n.t(
                  "repeat_" + task.repeat.frequency
                )}`
              : i18n.t("one_time_task")}
          </Text>

          <Text style={styles.label}>{i18n.t("completed")}:</Text>
          <Text style={styles.value}>
            {task.completed ? i18n.t("yes") + " ✅" : i18n.t("no") + " ❌"}
          </Text>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    width: "85%",
    position: "relative",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#2b2d42",
  },
  label: {
    fontWeight: "600",
    marginTop: 8,
    color: "#333",
  },
  value: {
    fontSize: 15,
    color: "#555",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#888",
    borderRadius: 20,
    padding: 6,
  },
});
