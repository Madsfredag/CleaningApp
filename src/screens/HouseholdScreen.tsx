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
import { Household } from "../types/Household";
import { Task } from "../types/Task";
import { AppUser } from "../types/User";
import QrCodeCard from "../components/QrCodeCard";
import { archiveOldCompletedTasks } from "../utils/archiveOldCompletedTasks";
import { handleToggleCompleteTask } from "../utils/handleToggleComplete";
import { deleteTaskWithCleanup } from "../utils/deleteTask";
import i18n from "../translations/i18n";
import { useLanguage } from "../context/LanguageContext";

export default function HouseholdScreen() {
  const { language } = useLanguage();
  const { user } = useAuth();
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
      if (!snap.empty) {
        const householdDoc = snap.docs[0];
        const householdData = householdDoc.data();
        const householdId = householdDoc.id;

        setHousehold({
          id: householdId,
          name: householdData.name,
          code: householdData.code,
          ownerId: householdData.ownerId,
          members: householdData.members,
        });

        setupListeners(householdId);
        await archiveOldCompletedTasks(householdId);
      }
    };

    fetchHousehold();
  }, [user]);

  const setupListeners = (householdId: string) => {
    const taskRef = collection(db, "households", householdId, "tasks");
    const unsubscribeTasks = onSnapshot(taskRef, (snap) => {
      const loadedTasks = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Task)
      );

      const priorityOrder: Record<NonNullable<Task["priority"]>, number> = {
        high: 0,
        medium: 1,
        low: 2,
      };

      const sorted = [...loadedTasks].sort((a, b) => {
        const aRank = a.priority ? priorityOrder[a.priority] : 3;
        const bRank = b.priority ? priorityOrder[b.priority] : 3;
        return aRank - bRank;
      });

      setTasks(sorted);
    });

    const unsubHousehold = onSnapshot(
      doc(db, "households", householdId),
      async (docSnap) => {
        const data = docSnap.data();
        if (data?.members) {
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
      }
    );

    return () => {
      unsubscribeTasks();
      unsubHousehold();
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

  return (
    <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{i18n.t("tasks")}</Text>
              <TouchableOpacity onPress={handleAdd}>
                <Text style={styles.actionText}>{i18n.t("add_task")}</Text>
              </TouchableOpacity>
            </View>

            {tasks.length === 0 ? (
              <Text style={styles.emptyText}>{i18n.t("no_tasks_yet")}</Text>
            ) : (
              tasks.map((task) => (
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

          <QrCodeCard household={household} />
          <MembersCard members={members} />
        </ScrollView>

        <TaskModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          household={household}
          task={selectedTask}
          members={members}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffffcc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2b2d42",
  },
  actionText: {
    color: "#ff8c42",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyText: {
    fontStyle: "italic",
    color: "#555",
  },
});
