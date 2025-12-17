import {
  doc,
  collection,
  addDoc,
  updateDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Task } from "../types/Task";
import { getNextDueDate } from "./getNextDueDate";

export async function spawnNextRecurringTaskOnce(task: Task) {
  if (!task.repeat) return;

  const taskRef = doc(db, "households", task.householdId, "tasks", task.id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(taskRef);
    if (!snap.exists()) return;

    const fresh = snap.data() as Task;

    // ✅ idempotency guard (works for old tasks too: undefined !== true)
    if (fresh.hasSpawnedNext === true) return;

    const currentDue =
      fresh.dueDate instanceof Date
        ? fresh.dueDate
        : (fresh.dueDate as any).toDate();

    const nextDue = getNextDueDate(
      currentDue,
      fresh.repeat!.frequency,
      fresh.repeat!.interval
    );

    // Create the next instance
    const tasksCol = collection(db, "households", task.householdId, "tasks");
    await addDoc(tasksCol, {
      title: fresh.title,
      assignedTo: fresh.assignedTo,
      repeat: fresh.repeat,
      completed: false,
      createdAt: new Date(),
      dueDate: nextDue,
      householdId: task.householdId,
      priority: fresh.priority ?? "medium",
      details: fresh.details ?? "",
      hasSpawnedNext: false,
    });

    // Mark original as “already spawned”
    tx.update(taskRef, { hasSpawnedNext: true });
  });
}
