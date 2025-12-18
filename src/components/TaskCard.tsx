import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Task } from "../types/Task";
import { AppUser } from "../types/User";
import { Ionicons } from "@expo/vector-icons";
import TaskDetailsModal from "./TaskDetailsModal";
import i18n from "../translations/i18n";
import CompleteButton from "./CompleteButton";

interface Props {
  task: Task;
  members: AppUser[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  backgroundColor?: string;
}

export default function TaskCard({
  task,
  members,
  onEdit,
  onDelete,
  onToggleComplete,
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
        activeOpacity={0.9}
      >
        <CompleteButton
          onToggleComplete={onToggleComplete}
          completed={task.completed}
        />

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

        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
            <Ionicons name="create-outline" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color="#d90429" />
          </TouchableOpacity>
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
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,

    flexDirection: "row",
    alignItems: "center",

    borderLeftWidth: 10,

    backgroundColor: "#ffffff",

    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
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

  completedText: {
    textDecorationLine: "line-through",
    color: "#424040ff",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },

  editBtn: {
    padding: 6,
  },

  deleteBtn: {
    padding: 6,
  },
});
