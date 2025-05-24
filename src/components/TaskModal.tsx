// components/TaskModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Alert,
} from "react-native";
import {
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Household } from "../types/Household";
import { Task, TaskRepeat } from "../types/Task";
import MemberPicker from "./MemberPicker";
import RepeatSelector from "./RepeatSelector";
import { AppUser } from "../types/User";

interface Props {
  visible: boolean;
  onClose: () => void;
  household: Household;
  task: Task | null;
  members: AppUser[];
}

export default function TaskModal({
  visible,
  onClose,
  household,
  task,
  members,
}: Props) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<TaskRepeat | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setAssignedTo(task.assignedTo);
      setRepeat(task.repeat);
    } else {
      setTitle("");
      setAssignedTo(null);
      setRepeat(null); // One-time task
    }
  }, [task]);

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert("Enter a task title");
    const data = {
      title: title.trim(),
      assignedTo,
      repeat,
      completed: false,
      createdAt: new Date(),
    };

    if (task) {
      await updateDoc(
        doc(db, "households", household.id, "tasks", task.id),
        data
      );
    } else {
      await addDoc(collection(db, "households", household.id, "tasks"), data);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(
            doc(db, "households", household.id, "tasks", task.id)
          );
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{task ? "Edit Task" : "New Task"}</Text>
          <TextInput
            placeholder="Task title"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />
          <MemberPicker
            household={household}
            value={assignedTo}
            onChange={setAssignedTo}
            members={members}
          />
          <RepeatSelector value={repeat} onChange={setRepeat} />
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} />
            {task && (
              <Button title="Delete" onPress={handleDelete} color="#d90429" />
            )}
            <Button title="Save" onPress={handleSave} color="#28a745" />
          </View>
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
    padding: 20,
    borderRadius: 20,
    width: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});
