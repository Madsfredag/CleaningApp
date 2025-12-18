import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { collection, doc, onSnapshot, getDoc } from "firebase/firestore";

import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";

import { Task } from "../types/Task";
import { AppUser } from "../types/User";

import { handleToggleCompleteTask } from "../utils/handleToggleComplete";
import { deleteTaskWithCleanup } from "../utils/deleteTask";

import i18n from "../translations/i18n";
import { useLanguage } from "../context/LanguageContext";

import { shouldShowTask, sortByPriorityAndDate } from "../utils/taskRules";

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---------------- FETCH TASKS ----------------

  useEffect(() => {
    if (!user) return navigation.replace("Login");

    const fetchTasksForHousehold = async () => {
      const userDoc = await getDoc(doc(db, "users", user.id));
      if (!userDoc.exists()) return;

      const userData = userDoc.data() as AppUser;
      const householdId = userData.householdId;
      if (!householdId) return;

      const taskRef = collection(db, "households", householdId, "tasks");

      const unsub = onSnapshot(taskRef, (snap) => {
        const loadedTasks: Task[] = snap.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              ...(data as Omit<Task, "id">),
              id: docSnap.id,
              householdId,
            };
          })
          .filter(
            (task) =>
              task.assignedTo === user.id ||
              task.assignedTo === null ||
              task.assignedTo === ""
          );

        setTasks(loadedTasks);
        setLoading(false);
      });

      return () => unsub();
    };

    fetchTasksForHousehold();
  }, [user]);

  // ---------------- LOAD MEMBERS ----------------

  useEffect(() => {
    const loadMembers = async () => {
      const ids = [...new Set(tasks.map((t) => t.assignedTo).filter(Boolean))];
      const results = await Promise.all(
        ids.map(async (uid) => {
          const docSnap = await getDoc(doc(db, "users", uid!));
          if (!docSnap.exists()) return null;
          const data = docSnap.data() as Omit<AppUser, "id">;
          return { ...data, id: uid! };
        })
      );
      setMembers(results.filter(Boolean) as AppUser[]);
    };

    if (tasks.length > 0) loadMembers();
  }, [tasks]);

  // ---------------- ACTIONS ----------------

  const toggleComplete = async (task: Task) => {
    try {
      await handleToggleCompleteTask(task);
    } catch {
      Alert.alert(i18n.t("error"), i18n.t("failed_to_update_task"));
    }
  };

  const handleDelete = async (task: Task) => {
    Alert.alert(i18n.t("delete_task"), i18n.t("delete_task_confirm"), [
      { text: i18n.t("cancel"), style: "cancel" },
      {
        text: i18n.t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTaskWithCleanup(task, user!.id);
          } catch {
            Alert.alert(i18n.t("error"), i18n.t("failed_to_delete_task"));
          }
        },
      },
    ]);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  // ---------------- DATE BOUNDARIES (CRITICAL FIX) ----------------

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  // ---------------- DOMAIN LOGIC ----------------

  const visibleTasks = tasks.filter(shouldShowTask);

  const todayTasks = visibleTasks.filter((t) => {
    const due =
      t.dueDate instanceof Date ? t.dueDate : (t.dueDate as any).toDate();
    return due >= startOfToday && due < startOfTomorrow;
  });

  const weekTasks = visibleTasks.filter((t) => {
    const due =
      t.dueDate instanceof Date ? t.dueDate : (t.dueDate as any).toDate();
    return due >= startOfTomorrow && due <= endOfWeek;
  });

  const upcomingTasks = visibleTasks.filter((t) => {
    const due =
      t.dueDate instanceof Date ? t.dueDate : (t.dueDate as any).toDate();
    return due > endOfWeek;
  });

  // ---------------- RENDER ----------------

  const renderGroup = (label: string, group: Task[]) => (
    <View style={styles.taskGroupCard}>
      <Text style={styles.groupTitle}>{label}</Text>

      {group.length === 0 ? (
        <Text style={styles.emptyText}>{i18n.t("no_tasks")}</Text>
      ) : (
        group
          .sort(sortByPriorityAndDate)
          .map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              onEdit={() => handleEdit(task)}
              onDelete={() => handleDelete(task)}
              onToggleComplete={() => toggleComplete(task)}
            />
          ))
      )}
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          <Text style={styles.title}>{i18n.t("your_cleaning_tasks")}</Text>

          {renderGroup(i18n.t("today"), todayTasks)}
          {renderGroup(i18n.t("this_week"), weekTasks)}
          {renderGroup(i18n.t("upcoming"), upcomingTasks)}
        </ScrollView>

        <TaskModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          task={selectedTask}
          household={{
            id: selectedTask?.householdId ?? "",
            name: "",
            code: "",
            ownerId: "",
            members: [],
          }}
          members={members}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ---------------- STYLES ----------------

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
    color: "#1a1a2e",
  },

  emptyText: {
    fontStyle: "italic",
    color: "#555",
    textAlign: "center",
  },

  taskGroupCard: {
    backgroundColor: "#ffffffcc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    marginHorizontal: 16,
  },

  groupTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2b2d42",
    textAlign: "center",
    marginBottom: 12,
  },
});
