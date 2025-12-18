import { Task } from "../types/Task";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ---------- visibility ----------

export const shouldShowTask = (task: Task) => {
  if (!task.completed) return true;

  const due =
    task.dueDate instanceof Date
      ? task.dueDate
      : (task.dueDate as any).toDate();

  return due >= startOfToday();
};

// ---------- overdue ----------

export const isTaskOverdue = (task: Task, now = new Date()) => {
  const due =
    task.dueDate instanceof Date
      ? task.dueDate
      : (task.dueDate as any).toDate();

  const overdueAt = new Date(due);
  overdueAt.setDate(overdueAt.getDate() + 1);
  overdueAt.setHours(0, 1, 0, 0);

  return now >= overdueAt;
};

// ---------- sorting ----------

export const sortByPriorityAndDate = (a: Task, b: Task) => {
  const priorityOrder: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  const pa = a.priority ? priorityOrder[a.priority] : 3;
  const pb = b.priority ? priorityOrder[b.priority] : 3;

  if (pa !== pb) return pa - pb;

  const da =
    a.dueDate instanceof Date ? a.dueDate : (a.dueDate as any).toDate();
  const db =
    b.dueDate instanceof Date ? b.dueDate : (b.dueDate as any).toDate();

  return da.getTime() - db.getTime();
};
