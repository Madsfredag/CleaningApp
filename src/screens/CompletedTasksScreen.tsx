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
  onSnapshot,
} from "firebase/firestore";

import { Task } from "../types/Task";

import i18n from "../translations/i18n";
import { useLanguage } from "../context/LanguageContext";
import ReadonlyTaskCard from "../components/ReadOnlyTaskCard";

import { useHouseholdMembers } from "../hooks/useHouseholdMembers";

export default function CompletedTasksScreen() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const members = useHouseholdMembers(householdId);

  // ---------------- FETCH HOUSEHOLD ID ----------------

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setHouseholdId(data.householdId ?? null);
    });

    return () => unsub();
  }, [user]);

  // ---------------- FETCH ARCHIVED TASKS ----------------

  useEffect(() => {
    if (!user || !householdId) return;

    const fetchArchivedTasks = async () => {
      try {
        const archivedSnap = await getDocs(
          collection(db, "households", householdId, "history")
        );

        const loadedTasks = archivedSnap.docs.map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Task)
        );

        // newest first
        loadedTasks.sort((a, b) => {
          const aDate =
            a.dueDate instanceof Date ? a.dueDate : (a.dueDate as any).toDate();
          const bDate =
            b.dueDate instanceof Date ? b.dueDate : (b.dueDate as any).toDate();
          return bDate.getTime() - aDate.getTime();
        });

        setTasks(loadedTasks);
      } catch (err) {
        console.error("Error loading archived tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedTasks();
  }, [user, householdId]);

  // ---------------- COLOR MAP ----------------

  const memberColorMap = Object.fromEntries(
    members.filter((m) => m.taskColor).map((m) => [m.id, m.taskColor!])
  );

  // ---------------- LOADING ----------------

  if (loading) {
    return (
      <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ---------------- UI ----------------

  return (
    <LinearGradient colors={["#a1c4fd", "#c2e9fb"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>
              {i18n.t("completed_cleaning_tasks")}
            </Text>

            {tasks.length === 0 ? (
              <Text style={styles.emptyText}>
                {i18n.t("no_archived_tasks")}
              </Text>
            ) : (
              tasks.map((task) => (
                <ReadonlyTaskCard
                  key={task.id}
                  task={task}
                  members={members}
                  backgroundColor={
                    task.assignedTo
                      ? memberColorMap[task.assignedTo] ?? "#fff"
                      : "#fff"
                  }
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ---------------- STYLES ----------------

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
    textAlign: "center",
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
