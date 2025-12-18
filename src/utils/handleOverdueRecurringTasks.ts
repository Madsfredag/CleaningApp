import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Task } from "../types/Task";
import { spawnNextRecurringTaskOnce } from "./spawnNextRecurringTask";
import { isTaskOverdue } from "./taskRules";

export async function handleOverdueRecurringTasks(householdId: string) {
  const snap = await getDocs(
    collection(db, "households", householdId, "tasks")
  );

  const tasks = snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as any) } as Task)
  );

  const overdueRecurring = tasks.filter((t) => {
    if (t.completed) return false;
    if (!t.repeat) return false;
    if (t.hasSpawnedNext === true) return false;

    return isTaskOverdue(t);
  });

  // Spawn next task ONCE per overdue task
  for (const t of overdueRecurring) {
    await spawnNextRecurringTaskOnce({
      ...t,
      householdId,
    });
  }
}
