// types/Task.ts

export type TaskFrequency = "once" | "daily" | "weekly" | "monthly";

export interface TaskRepeat {
  frequency: TaskFrequency;
  interval: number;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string | null;
  repeat: TaskRepeat | null;
  completed: boolean;
  createdAt: Date;
}
