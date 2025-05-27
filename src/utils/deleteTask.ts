import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { cancelTaskReminder } from "./scheduleLocalReminder";
import { sendPushNotification } from "./sendPushNotification";
import { AppUser } from "../types/User";
import { Task } from "../types/Task";

export async function deleteTaskWithCleanup(task: Task, currentUserId: string) {
  const householdId = task.householdId;
  const taskRef = doc(db, "households", householdId, "tasks", task.id);

  // Cancel local notification
  if (task.assignedTo === currentUserId) {
    await cancelTaskReminder(task.id, currentUserId);
  }

  // Send push notifications to others
  const householdDoc = await getDoc(doc(db, "households", householdId));
  const members: string[] = householdDoc.data()?.members ?? [];

  const userDocs = await Promise.all(
    members
      .filter((uid) => uid !== currentUserId)
      .map(async (uid) => {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (!userDoc.exists()) return null;
        const user = userDoc.data() as AppUser;
        return user.pushToken ?? null;
      })
  );

  const tokens = userDocs.filter(Boolean) as string[];
  for (const token of tokens) {
    await sendPushNotification(token, "Task Notification", `“${task.title}” was deleted`);
  }

  // Delete the task from Firestore
  await deleteDoc(taskRef);
}
