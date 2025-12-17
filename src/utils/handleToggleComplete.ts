import { doc, updateDoc } from "firebase/firestore";
import { Task } from "../types/Task";
import { db } from "../firebase/firebaseConfig";
import { spawnNextRecurringTaskOnce } from "./spawnNextRecurringTask";

export const handleToggleCompleteTask = async (task: Task) => {
  const ref = doc(db, "households", task.householdId, "tasks", task.id);
  const newCompleted = !task.completed;

  await updateDoc(ref, { completed: newCompleted });

  // if recurring and completed, spawn next ONCE
  if (newCompleted) {
    await spawnNextRecurringTaskOnce(task);
  }
};
