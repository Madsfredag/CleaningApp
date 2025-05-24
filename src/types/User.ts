// types/User.ts
export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  householdId?: string;
  points?: number;
}
