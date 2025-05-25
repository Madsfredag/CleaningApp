import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebaseConfig";
import {
  collectionGroup,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import { Task, TaskPriority } from "../types/Task";
import { AppUser } from "../types/User";

type FirestoreTask = Task & {
  __path: string;
  householdId: string;
};

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<FirestoreTask[]>([]);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [selectedTask, setSelectedTask] = useState<FirestoreTask | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigation.replace("Login");
      return;
    }

    const q1 = query(
      collectionGroup(db, "tasks"),
      where("assignedTo", "==", user.uid)
    );

    const q2 = query(
      collectionGroup(db, "tasks"),
      where("assignedTo", "==", null)
    );

    const q3 = query(
      collectionGroup(db, "tasks"),
      where("assignedTo", "==", "")
    );

    const unsubscribers = [q1, q2, q3].map((q) =>
      onSnapshot(q, (snap) => {
        const newTasks: FirestoreTask[] = snap.docs.map((docSnap) => {
          const ref = docSnap.ref;
          const householdId = ref.parent.parent?.id ?? "";
          return {
            id: docSnap.id,
            ...(docSnap.data() as Omit<Task, "id">),
            __path: ref.path,
            householdId,
          };
        });

        setTasks((prev) => {
          const merged = [...prev, ...newTasks];
          const deduped = Object.values(
            merged.reduce((acc, task) => {
              acc[task.id] = task;
              return acc;
            }, {} as Record<string, FirestoreTask>)
          );

          const priorityOrder: Record<NonNullable<TaskPriority>, number> = {
            high: 0,
            medium: 1,
            low: 2,
          };

          return deduped.sort((a, b) => {
            const aRank = a.priority ? priorityOrder[a.priority] : 3;
            const bRank = b.priority ? priorityOrder[b.priority] : 3;
            return aRank - bRank;
          });
        });

        setLoading(false);
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      const memberIds = [
        ...new Set(tasks.map((t) => t.assignedTo).filter(Boolean)),
      ];
      const memberMap = new Map<string, AppUser>();

      await Promise.all(
        memberIds.map(async (uid) => {
          const userDoc = await getDoc(doc(db, "users", uid!));
          if (userDoc.exists()) {
            memberMap.set(uid!, {
              id: uid!,
              ...(userDoc.data() as Omit<AppUser, "id">),
            });
          }
        })
      );

      setMembers(Array.from(memberMap.values()));
    };

    if (tasks.length > 0) {
      loadMembers();
    }
  }, [tasks]);

  const toggleComplete = async (task: FirestoreTask) => {
    try {
      const taskRef = doc(db, task.__path);
      await updateDoc(taskRef, { completed: !task.completed });
    } catch (error) {
      Alert.alert("Error", "Failed to update task.");
    }
  };

  const handleDelete = async (task: FirestoreTask) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const ref = doc(db, task.__path);
            await deleteDoc(ref);
          } catch (err) {
            Alert.alert("Error", "Failed to delete task.");
          }
        },
      },
    ]);
  };

  const handleEdit = (task: FirestoreTask) => {
    setSelectedTask(task);
    setShowModal(true);
  };

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
        <Text style={styles.title}>Your Assigned Tasks</Text>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>You have no assigned tasks.</Text>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                members={members}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
                onToggleComplete={() => toggleComplete(item)}
              />
            )}
          />
        )}

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
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    color: "#2b2d42",
  },
  emptyText: {
    fontStyle: "italic",
    color: "#555",
  },
});
