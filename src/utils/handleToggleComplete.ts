import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { Task } from "../types/Task";
import { getNextDueDate } from "./getNextDueDate";
import { db } from "../firebase/firebaseConfig";

export const handleToggleCompleteTask = async (task: Task) => {
  const ref = doc(db, "households", task.householdId, "tasks", task.id);
  const newCompleted = !task.completed;

  await updateDoc(ref, { completed: newCompleted });

  // If recurring and completed, add next instance
  if (newCompleted && task.repeat) {
    const currentDue =
      task.dueDate instanceof Date
        ? task.dueDate
        : (task.dueDate as any).toDate();

    const nextDue = getNextDueDate(
      currentDue,
      task.repeat.frequency,
      task.repeat.interval
    );

    await addDoc(collection(db, "households", task.householdId, "tasks"), {
      title: task.title,
      assignedTo: task.assignedTo,
      repeat: task.repeat,
      completed: false,
      createdAt: new Date(),
      dueDate: nextDue,
      householdId: task.householdId,
      priority: task.priority ?? "medium",
      details: task.details ?? "",
    });
  }
};
