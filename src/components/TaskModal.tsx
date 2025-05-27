import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDoc,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Household } from "../types/Household";
import { Task, TaskRepeat, TaskPriority } from "../types/Task";
import MemberPicker from "./MemberPicker";
import RepeatSelector from "./RepeatSelector";
import { AppUser } from "../types/User";
import { sendPushNotification } from "../utils/sendPushNotification";
import { useAuth } from "../context/AuthContext";
import {
  cancelTaskReminder,
  scheduleTaskReminder,
} from "../utils/scheduleLocalReminder";

interface Props {
  visible: boolean;
  onClose: () => void;
  household: Household;
  task: Task | null;
  members: AppUser[];
}

const PRIORITY_LEVELS: TaskPriority[] = ["low", "medium", "high"];

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
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [details, setDetails] = useState("");
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setAssignedTo(task.assignedTo);
      setRepeat(task.repeat);
      setPriority(task.priority ?? "medium");
      setDetails(task.details ?? "");
      const rawDate = task.dueDate;
      setDueDate(
        rawDate instanceof Date ? rawDate : (rawDate as Timestamp).toDate()
      );
    } else {
      resetForm();
    }
  }, [task]);

  const resetForm = () => {
    setTitle("");
    setAssignedTo(null);
    setRepeat(null);
    setPriority("medium");
    setDetails("");
    setDueDate(new Date());
  };

  const sendNotifications = async (
    title: string,
    type: "created" | "updated" | "deleted"
  ) => {
    if (!user) return;

    const userDocs = await Promise.all(
      household.members
        .filter((uid) => uid !== user.id) // skip sender
        .map(async (uid) => {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (!userDoc.exists()) return null;
          const member = userDoc.data() as AppUser;
          return member.pushToken ? member.pushToken : null;
        })
    );

    const tokens = userDocs.filter(Boolean) as string[];
    const message =
      type === "deleted"
        ? `“${title}” was deleted`
        : `“${title}” was ${type === "created" ? "created" : "updated"}`;

    for (const token of tokens) {
      await sendPushNotification(token, "Task Notification", message);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert("Enter a task title");

    const newData = {
      title: title.trim(),
      assignedTo,
      repeat,
      completed: task?.completed ?? false,
      createdAt: task?.createdAt ?? new Date(),
      dueDate,
      householdId: household.id,
      priority,
      details: details.trim(),
    };

    let newTaskId = task?.id;

    if (task) {
      // Cancel old reminder (if assignee changed, due date changed, etc.)
      if (task.assignedTo && user?.id === task.assignedTo) {
        await cancelTaskReminder(task.id, task.assignedTo);
      }
      await updateDoc(
        doc(db, "households", household.id, "tasks", task.id),
        newData
      );
      await sendNotifications(title.trim(), "updated");
    } else {
      const docRef = await addDoc(
        collection(db, "households", household.id, "tasks"),
        newData
      );
      newTaskId = docRef.id;
      await sendNotifications(title.trim(), "created");
    }

    // ⏰ Schedule new reminder if this user is the assignee
    if (user && newTaskId && (!assignedTo || user.id === assignedTo)) {
      await scheduleTaskReminder({ ...newData, id: newTaskId } as Task, user);
    }

    resetForm();
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
          try {
            await deleteDoc(
              doc(db, "households", household.id, "tasks", task.id)
            );

            if (task.assignedTo && user?.id === task.assignedTo) {
              await cancelTaskReminder(task.id, task.assignedTo);
            }

            // ✅ Ensure this runs BEFORE closing modal
            await sendNotifications(task.title, "deleted");

            onClose(); // ⬅️ only close the modal after the notification is sent
          } catch (err) {
            console.error(
              "❌ Error deleting task or sending notification:",
              err
            );
          }
        },
      },
    ]);
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setDueDate(selectedDate);
  };

  const toggleDatePicker = () => {
    setShowDatePicker((prev) => !prev);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>{task ? "Edit Task" : "New Task"}</Text>

            <Text style={styles.label}>Task Title</Text>
            <TextInput
              placeholder="Task title"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Due Date</Text>
            <TouchableOpacity
              onPress={toggleDatePicker}
              style={styles.dateDisplay}
            >
              <Text style={styles.dateText}>
                {dueDate.toLocaleDateString("da-DK", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.label}>Assigned To</Text>
            <MemberPicker
              household={household}
              value={assignedTo}
              onChange={setAssignedTo}
              members={members}
            />

            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityGroup}>
              {PRIORITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setPriority(level)}
                  style={[
                    styles.priorityOption,
                    priority === level && styles.prioritySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      priority === level && styles.priorityTextSelected,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <RepeatSelector value={repeat} onChange={setRepeat} />

            <Text style={styles.label}>Details</Text>
            <TextInput
              placeholder="Extra info..."
              style={[styles.input, styles.textArea]}
              value={details}
              onChangeText={setDetails}
              multiline
            />

            <View style={styles.buttonRow}>
              <Button title="Cancel" onPress={onClose} />
              {task && (
                <Button title="Delete" onPress={handleDelete} color="#d90429" />
              )}
              <Button title="Save" onPress={handleSave} color="#28a745" />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    borderRadius: 20,
    width: "92%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    color: "#2b2d42",
    textAlign: "center",
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 12,
    color: "#333",
  },
  input: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dateDisplay: {
    backgroundColor: "#e4f0ff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    color: "#2b2d42",
  },
  priorityGroup: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    alignItems: "center",
  },
  prioritySelected: {
    backgroundColor: "#2b2d42",
  },
  priorityText: {
    color: "#333",
    fontWeight: "500",
  },
  priorityTextSelected: {
    color: "white",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
});
