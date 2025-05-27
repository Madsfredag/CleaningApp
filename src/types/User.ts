export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  householdId?: string | null;
  points?: number;
  pushToken?: string | null;
}
