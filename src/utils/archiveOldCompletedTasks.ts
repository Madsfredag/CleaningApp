import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Task } from "../types/Task";

export async function archiveOldCompletedTasks(householdId: string): Promise<void> {
  const now = new Date();
  const taskRef = collection(db, "households", householdId, "tasks");
  const snap = await getDocs(taskRef);

  const tasks = snap.docs.map((docSnap) => {
    const data = docSnap.data() as Task;
    return { ...data, id: docSnap.id };
  });

  const tasksToArchive = tasks.filter((task) => {
    const dueDate = task.dueDate instanceof Date ? task.dueDate : (task.dueDate as any).toDate();
    return task.completed && dueDate < now;
  });

  for (const task of tasksToArchive) {
    const { id, ...taskData } = task;
    await addDoc(collection(db, "households", householdId, "history"), taskData);
    await deleteDoc(doc(db, "households", householdId, "tasks", id));
  }
}
