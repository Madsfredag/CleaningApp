import { TaskFrequency } from "../types/Task";

export function getNextDueDate(current: Date, frequency: TaskFrequency, interval: number): Date {
  const next = new Date(current);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7 * interval);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + interval);
      break;
    default:
      break;
  }

  return next;
}
