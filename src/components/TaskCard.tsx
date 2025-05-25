import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Task } from "../types/Task";
import { AppUser } from "../types/User";
import { Ionicons } from "@expo/vector-icons";
import TaskDetailsModal from "./TaskDetailsModal";

interface Props {
  task: Task;
  members: AppUser[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}

export default function TaskCard({
  task,
  members,
  onEdit,
  onDelete,
  onToggleComplete,
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
        style={[styles.card, { borderLeftColor: priorityColor }]}
        onPress={() => setDetailsVisible(true)}
        activeOpacity={0.9}
      >
        <TouchableOpacity onPress={onToggleComplete} style={styles.checkbox}>
          <Ionicons
            name={task.completed ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={task.completed ? "#28a745" : "#ccc"}
          />
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={[styles.title, task.completed && styles.completedText]}>
            {task.title}
          </Text>
          <Text style={styles.meta}>Due: {formattedDueDate}</Text>
          <Text style={styles.assigned}>
            Assigned to:{" "}
            {assignedUser?.displayName || (
              <Text style={{ fontStyle: "italic" }}>Anyone</Text>
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
    fontWeight: "500",
    color: "#2b2d42",
  },
  meta: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  assigned: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#aaa",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    marginHorizontal: 6,
  },
  deleteBtn: {
    marginHorizontal: 6,
  },
});
