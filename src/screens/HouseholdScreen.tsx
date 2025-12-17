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
  doc,
  onSnapshot,
  query,
  where,
  getDoc,
  getDocs,
} from "firebase/firestore";
import MembersCard from "../components/MembersCard";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import QrCodeCard from "../components/QrCodeCard";
import { Household } from "../types/Household";
import { Task } from "../types/Task";
import { AppUser } from "../types/User";
import { archiveOldCompletedTasks } from "../utils/archiveOldCompletedTasks";
import { handleToggleCompleteTask } from "../utils/handleToggleComplete";
import { deleteTaskWithCleanup } from "../utils/deleteTask";
import { handleOverdueRecurringTasks } from "../utils/handleOverdueRecurringTasks";
import i18n from "../translations/i18n";
import { useLanguage } from "../context/LanguageContext";
import { isTaskOverdue } from "../utils/isTaskOverdue";

export default function HouseholdScreen() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchHousehold = async () => {
      const q = query(
        collection(db, "households"),
        where("members", "array-contains", user.id)
      );
      const snap = await getDocs(q);
      if (snap.empty) return;

      const householdDoc = snap.docs[0];
      const householdId = householdDoc.id;
      const data = householdDoc.data();

      setHousehold({
        id: householdId,
        name: data.name,
        code: data.code,
        ownerId: data.ownerId,
        members: data.members,
      });

      setupListeners(householdId);

      // background maintenance
      await archiveOldCompletedTasks(householdId);
      await handleOverdueRecurringTasks(householdId);
    };

    fetchHousehold();
  }, [user]);

  const setupListeners = (householdId: string) => {
    const taskRef = collection(db, "households", householdId, "tasks");

    const unsubscribeTasks = onSnapshot(taskRef, (snap) => {
      const loadedTasks = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Task)
      );
      setTasks(loadedTasks);
    });

    const unsubscribeHousehold = onSnapshot(
      doc(db, "households", householdId),
      async (docSnap) => {
        const data = docSnap.data();
        if (!data?.members) return;

        const userDocs = await Promise.all(
          data.members.map(async (uid: string) => {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (!userDoc.exists()) return null;
            return {
              id: userDoc.id,
              ...(userDoc.data() as Omit<AppUser, "id">),
            };
          })
        );

        setMembers(userDocs.filter(Boolean) as AppUser[]);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeHousehold();
    };
  };

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

  if (!user || !household) {
    return (
      <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ---------- UI grouping ----------

  const overdueTasks = tasks.filter((t) => !t.completed && isTaskOverdue(t));

  const normalTasks = tasks.filter((t) => !overdueTasks.includes(t));

  const renderTaskList = (list: Task[]) =>
    list.map((task) => (
      <TaskCard
        key={task.id}
        task={task}
        members={members}
        onEdit={() => handleEdit(task)}
        onDelete={() => handleDelete(task)}
        onToggleComplete={() => toggleComplete(task)}
      />
    ));

  return (
    <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* OVERDUE */}
          {overdueTasks.length > 0 && (
            <View style={styles.overdueCard}>
              <Text style={styles.overdueTitle}>{i18n.t("overdue_tasks")}</Text>
              {renderTaskList(overdueTasks)}
            </View>
          )}

          {/* NORMAL TASKS */}
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
          <MembersCard members={members} />
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

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
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
    borderColor: "#f5c2c2",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
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
});
