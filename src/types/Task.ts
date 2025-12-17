export type TaskFrequency = "once" | "daily" | "weekly" | "monthly";

export type TaskPriority = "low" | "medium" | "high";

export interface TaskRepeat {
  frequency: TaskFrequency;
  interval: number; // e.g., every 2 days or every 3 weeks
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string | null;
  repeat: TaskRepeat | null;
  completed: boolean;
  createdAt: Date;
  dueDate: Date;
  householdId: string;
  priority?: TaskPriority;
  details?: string;
  hasSpawnedNext?: boolean;
}
