import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { Task } from "../types/Task";
import { AppUser } from "../types/User";
import TaskCard from "../components/TaskCard";

export default function CompletedTasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchArchivedTasks = async () => {
      try {
        const q = query(
          collection(db, "households"),
          where("members", "array-contains", user.uid)
        );
        const snap = await getDocs(q);
        if (snap.empty) return;

        const householdDoc = snap.docs[0];
        const householdId = householdDoc.id;

        const archivedSnap = await getDocs(
          collection(db, "households", householdId, "history")
        );

        const loadedTasks = archivedSnap.docs.map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Task)
        );

        loadedTasks.sort((a, b) => {
          const aDate =
            a.dueDate instanceof Date ? a.dueDate : (a.dueDate as any).toDate();
          const bDate =
            b.dueDate instanceof Date ? b.dueDate : (b.dueDate as any).toDate();
          return bDate.getTime() - aDate.getTime();
        });

        setTasks(loadedTasks);

        const memberIds = [
          ...new Set(loadedTasks.map((t) => t.assignedTo).filter(Boolean)),
        ];
        const userDocs = await Promise.all(
          memberIds.map(async (uid) => {
            if (!uid) return null;
            const userRef = doc(db, "users", uid);
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) return null;
            return {
              id: userDoc.id,
              ...(userDoc.data() as Omit<AppUser, "id">),
            };
          })
        );
        setMembers(userDocs.filter(Boolean) as AppUser[]);
      } catch (err) {
        console.error("Error loading archived tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedTasks();
  }, [user]);

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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>Completed Cleaning Tasks</Text>
            {tasks.length === 0 ? (
              <Text style={styles.emptyText}>No archived tasks found.</Text>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  members={members}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onToggleComplete={() => {}}
                />
              ))
            )}
          </View>
        </ScrollView>
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
  titleCard: {
    backgroundColor: "#ffffffcc",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2b2d42",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontStyle: "italic",
    color: "#555",
  },
  card: {
    backgroundColor: "#ffffffcc",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
});
