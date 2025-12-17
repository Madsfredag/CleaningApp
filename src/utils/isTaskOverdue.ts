import { Task } from "../types/Task";

export function isTaskOverdue(task: Task, now = new Date()): boolean {
  const due =
    task.dueDate instanceof Date
      ? task.dueDate
      : (task.dueDate as any).toDate();

  const overdueAt = new Date(due);
  overdueAt.setDate(overdueAt.getDate() + 1);
  overdueAt.setHours(0, 1, 0, 0); // 00:01 next day

  return now >= overdueAt;
}
