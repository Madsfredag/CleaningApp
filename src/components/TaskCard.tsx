import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Task } from "../types/Task";
import { AppUser } from "../types/User";

interface Props {
  task: Task;
  members: AppUser[];
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskCard({ task, members, onEdit, onDelete }: Props) {
  const assignedUser = members.find((u) => u.id === task.assignedTo);

  const repeatText = task.repeat
    ? task.repeat.frequency === "once"
      ? "One-time task"
      : `Every ${task.repeat.interval} ${task.repeat.frequency}${
          task.repeat.interval > 1 ? "s" : ""
        }`
    : "One-time task";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, task.completed && styles.completed]}>
          {task.title}
        </Text>
        <Text style={styles.assigned}>
          {assignedUser ? assignedUser.displayName : "Unassigned"}
        </Text>
      </View>
      <Text style={styles.repeat}>{repeatText}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffffcc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2b2d42",
  },
  completed: {
    textDecorationLine: "line-through",
    color: "#aaa",
  },
  assigned: {
    fontSize: 14,
    color: "#007AFF",
  },
  repeat: {
    fontSize: 13,
    color: "#555",
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  editBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteBtn: {
    backgroundColor: "#d90429",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "500",
  },
});
