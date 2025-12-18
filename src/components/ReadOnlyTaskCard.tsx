import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Task } from "../types/Task";
import { AppUser } from "../types/User";
import { Ionicons } from "@expo/vector-icons";
import TaskDetailsModal from "./TaskDetailsModal";
import i18n from "../translations/i18n";

interface Props {
  task: Task;
  members: AppUser[];
  backgroundColor?: string;
}

export default function ReadonlyTaskCard({
  task,
  members,
  backgroundColor,
}: Props) {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const assignedUser = members.find((m) => m.id === task.assignedTo);

  const priorityColor =
    task.priority === "high"
      ? "#ff6b6b"
      : task.priority === "medium"
      ? "#ffbe3b"
      : task.priority === "low"
      ? "#2ed573"
      : "#ccc";

  const formattedDueDate = (
    task.dueDate instanceof Date ? task.dueDate : (task.dueDate as any).toDate()
  ).toLocaleDateString("da-DK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          {
            borderLeftColor: priorityColor,
            backgroundColor: backgroundColor ?? "#fff",
          },
        ]}
        onPress={() => setDetailsVisible(true)}
      >
        <View style={styles.checkbox}>
          <Ionicons
            name={task.completed ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={task.completed ? "#28a745" : "#ccc"}
          />
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, task.completed && styles.completedText]}>
            {task.title}
          </Text>
          <Text style={styles.meta}>
            {i18n.t("due")}: {formattedDueDate}
          </Text>
          <Text style={styles.assigned}>
            {i18n.t("assigned_to")}:{" "}
            {assignedUser?.displayName || (
              <Text style={{ fontStyle: "italic" }}>{i18n.t("anyone")}</Text>
            )}
          </Text>
        </View>
      </TouchableOpacity>

      <TaskDetailsModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        task={task}
        assignedUser={assignedUser || null}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 6,
  },
  checkbox: {
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000ff", // near-black, modern
  },
  meta: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000ff",
    marginTop: 4,
  },
  assigned: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000ff",
    marginTop: 2,
  },
});
