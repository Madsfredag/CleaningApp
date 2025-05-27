import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Task } from '../types/Task';
import { AppUser } from '../types/User';
import i18n from '../translations/i18n';

/**
 * Schedules a local reminder for 9:00 AM on the task's due date,
 * only if the current user is the assignee.
 */
export async function scheduleTaskReminder(task: Task, user: AppUser) {
  if (!task.dueDate) return;
  if (task.assignedTo && task.assignedTo !== user.id) return;

  const raw =
    task.dueDate instanceof Date
      ? task.dueDate
      : (task.dueDate as any).toDate?.() ?? new Date(task.dueDate);

  const now = new Date();

  const year = raw.getFullYear();
  const month = raw.getMonth() + 1; // calendar months are 1-indexed
  const day = raw.getDate();

  const trigger: Notifications.CalendarTriggerInput = {
    type: SchedulableTriggerInputTypes.CALENDAR,
    year,
    month,
    day,
    hour: 9,
    minute: 0,
    second: 0,
    repeats: false,
  };

  const scheduledDate = new Date(year, month - 1, day, 9, 0, 0);

  if (scheduledDate <= now) {
    console.log("⏭️ Skipping reminder, time already passed:", scheduledDate.toString());
    return;
  }

  try {
    const identifier = `${task.id}_${user.id}`;
    console.log("📆 Scheduling notification:", identifier, scheduledDate.toString());

    await Notifications.scheduleNotificationAsync({
      identifier, // use this to cancel it later
      content: {
        title: i18n.t("task_reminder_title"),
        body: i18n.t("task_reminder_body", { title: task.title }),
        sound: true,
      },
      trigger,
    });
  } catch (err) {
    console.error("❌ Failed to schedule reminder:", err);
  }
}

/**
 * Cancels any local notifications for a given task + user.
 */
export async function cancelTaskReminder(taskId: string, userId: string) {
  const identifier = `${taskId}_${userId}`;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log("🚫 Cancelled notification:", identifier);
  } catch (err) {
    console.warn("⚠️ Could not cancel notification:", identifier, err);
  }
}
