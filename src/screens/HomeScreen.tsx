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
import {
  collection,
  doc,
  onSnapshot,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import { Task, TaskPriority } from "../types/Task";
import { AppUser } from "../types/User";
import { handleToggleCompleteTask } from "../utils/handleToggleComplete";

const priorityOrder: Record<NonNullable<TaskPriority>, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return navigation.replace("Login");

    const fetchTasksForHousehold = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
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
              task.assignedTo === user.uid ||
              task.assignedTo === null ||
              task.assignedTo === ""
          );

        setTasks(loadedTasks);
        setLoading(false);
      });

      return () => unsub();
    };

    fetchTasksForHousehold();
  }, []);

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

  const toggleComplete = async (task: Task) => {
    try {
      await handleToggleCompleteTask(task);
    } catch {
      Alert.alert("Error", "Failed to update task.");
    }
  };

  const handleDelete = async (task: Task) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const ref = doc(
              db,
              "households",
              task.householdId,
              "tasks",
              task.id
            );
            await deleteDoc(ref);
          } catch {
            Alert.alert("Error", "Failed to delete task.");
          }
        },
      },
    ]);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const todayTasks = tasks.filter((t) => {
    const due =
      t.dueDate instanceof Date ? t.dueDate : (t.dueDate as any).toDate();
    return due.toDateString() === today.toDateString();
  });

  const weekTasks = tasks.filter((t) => {
    const due =
      t.dueDate instanceof Date ? t.dueDate : (t.dueDate as any).toDate();
    return due > today && due <= endOfWeek;
  });

  const upcomingTasks = tasks.filter((t) => {
    const due =
      t.dueDate instanceof Date ? t.dueDate : (t.dueDate as any).toDate();
    return due > endOfWeek;
  });

  const renderGroup = (label: string, group: Task[]) => (
    <View style={styles.taskGroupCard}>
      <Text style={styles.groupTitle}>{label}</Text>
      {group.length === 0 ? (
        <Text style={styles.emptyText}>No tasks.</Text>
      ) : (
        group
          .sort((a, b) => {
            const aRank = a.priority ? priorityOrder[a.priority] : 3;
            const bRank = b.priority ? priorityOrder[b.priority] : 3;
            return aRank - bRank;
          })
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
          <Text style={styles.title}>Your Cleaning Tasks</Text>
          {renderGroup("Today", todayTasks)}
          {renderGroup("This Week", weekTasks)}
          {renderGroup("Upcoming", upcomingTasks)}
        </ScrollView>

        <TaskModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          household={{
            id: selectedTask?.householdId ?? "",
            name: "",
            code: "",
            ownerId: "",
            members: [],
          }}
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
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
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
