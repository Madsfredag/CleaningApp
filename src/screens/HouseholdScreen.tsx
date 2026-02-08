import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import QrCodeCard from "../components/QrCodeCard";

import { Household } from "../types/Household";
import { Task } from "../types/Task";

import { archiveOldCompletedTasks } from "../utils/archiveOldCompletedTasks";
import { handleToggleCompleteTask } from "../utils/handleToggleComplete";
import { deleteTaskWithCleanup } from "../utils/deleteTask";
import { handleOverdueRecurringTasks } from "../utils/handleOverdueRecurringTasks";

import i18n from "../translations/i18n";
import { useLanguage } from "../context/LanguageContext";

import {
  shouldShowTask,
  sortByPriorityAndDate,
  isTaskOverdue,
} from "../utils/taskRules";

import { useHouseholdMembers } from "../hooks/useHouseholdMembers";

export default function HouseholdScreen() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);

  const members = useHouseholdMembers(household?.id ?? null);

  // ---------------- FETCH HOUSEHOLD ----------------

  useEffect(() => {
    if (!user) return;

    const fetchHousehold = async () => {
      const q = query(
        collection(db, "households"),
        where("members", "array-contains", user.id),
      );

      const snap = await getDocs(q);
      if (snap.empty) return;

      const householdDoc = snap.docs[0];
      const data = householdDoc.data();

      setHousehold({
        id: householdDoc.id,
        name: data.name,
        code: data.code,
        ownerId: data.ownerId,
        members: data.members,
      });

      // background maintenance
      await archiveOldCompletedTasks(householdDoc.id);
      await handleOverdueRecurringTasks(householdDoc.id);
    };

    fetchHousehold();
  }, [user]);

  // ---------------- TASK LISTENER ----------------

  useEffect(() => {
    if (!household?.id) return;

    const taskRef = collection(db, "households", household.id, "tasks");

    const unsub = onSnapshot(taskRef, (snap) => {
      const loadedTasks = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Task,
      );
      setTasks(loadedTasks);
    });

    return () => unsub();
  }, [household?.id]);

  // ---------------- ACTIONS ----------------

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedTask(null);
    setShowModal(true);
  };

  const handleDelete = (task: Task) => {
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

  const toggleComplete = async (task: Task) => {
    try {
      await handleToggleCompleteTask(task);
    } catch {
      Alert.alert(i18n.t("error"), i18n.t("failed_to_update_task"));
    }
  };

  // ---------------- LOADING ----------------

  if (!user || !household) {
    return (
      <LinearGradient
        colors={["#acbdacff", "#4d4f4fff"]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ---------------- COLOR MAP ----------------

  const memberColorMap = Object.fromEntries(
    members.filter((m) => m.taskColor).map((m) => [m.id, m.taskColor!]),
  );

  // ---------------- DOMAIN LOGIC ----------------

  const visibleTasks = tasks.filter(shouldShowTask);

  const overdueTasks = visibleTasks
    .filter((t) => !t.completed && isTaskOverdue(t))
    .sort(sortByPriorityAndDate);

  const normalTasks = visibleTasks
    .filter((t) => !isTaskOverdue(t))
    .sort(sortByPriorityAndDate);

  const renderTaskList = (list: Task[]) =>
    list.map((task) => (
      <TaskCard
        key={task.id}
        task={task}
        members={members}
        onEdit={() => handleEdit(task)}
        onDelete={() => handleDelete(task)}
        onToggleComplete={() => toggleComplete(task)}
        backgroundColor={
          task.assignedTo ? (memberColorMap[task.assignedTo] ?? "#fff") : "#fff"
        }
      />
    ));

  // ---------------- UI ----------------

  return (
    <LinearGradient colors={["#acbdacff", "#4d4f4fff"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.houseHoldTitle}>
            {i18n.t("household_cleaning_tasks")}
          </Text>

          {overdueTasks.length > 0 && (
            <View style={styles.overdueCard}>
              <Text style={styles.overdueTitle}>{i18n.t("overdue_tasks")}</Text>
              {renderTaskList(overdueTasks)}
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{i18n.t("tasks")}</Text>
              <TouchableOpacity onPress={handleAdd}>
                <Text style={styles.actionText}>{i18n.t("add_task")}</Text>
              </TouchableOpacity>
            </View>

            {normalTasks.length === 0 ? (
              <Text style={styles.emptyText}>{i18n.t("no_tasks_yet")}</Text>
            ) : (
              renderTaskList(normalTasks)
            )}
          </View>

          <QrCodeCard household={household} />

          <View style={styles.membersCard}>
            <Text style={styles.membersTitle}>
              {i18n.t("household_members")}
            </Text>

            {members.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: m.taskColor ?? "#ccc" },
                  ]}
                />
                <Text style={styles.memberName}>
                  {m.displayName || m.email}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <TaskModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          task={selectedTask}
          household={household}
          members={members}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ---------------- STYLES ----------------

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, marginTop: -16 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: "#ffffffcc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  overdueCard: {
    backgroundColor: "#ffeaea",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  houseHoldTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
    color: "#1a1a2e",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2b2d42",
  },

  overdueTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#b00020",
    marginBottom: 12,
  },

  actionText: {
    color: "#ff8c42",
    fontWeight: "600",
  },

  emptyText: {
    fontStyle: "italic",
    color: "#555",
  },

  membersCard: {
    backgroundColor: "#ffffffcc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  membersTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2b2d42",
  },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },

  memberName: {
    fontSize: 16,
    color: "#333",
  },
});
