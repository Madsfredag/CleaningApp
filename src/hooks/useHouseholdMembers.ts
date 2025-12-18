import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { AppUser } from "../types/User";

export function useHouseholdMembers(householdId: string | null) {
  const [members, setMembers] = useState<AppUser[]>([]);
  const memberUnsubs = useRef<Record<string, () => void>>({});

  useEffect(() => {
    if (!householdId) return;

    const unsubscribeHousehold = onSnapshot(
      doc(db, "households", householdId),
      (householdSnap) => {
        const data = householdSnap.data();
        if (!data?.members) return;

        // remove users that left the household
        Object.keys(memberUnsubs.current).forEach((uid) => {
          if (!data.members.includes(uid)) {
            memberUnsubs.current[uid]();
            delete memberUnsubs.current[uid];
            setMembers((prev) => prev.filter((m) => m.id !== uid));
          }
        });

        // attach listeners for current members
        data.members.forEach((uid: string) => {
          if (memberUnsubs.current[uid]) return;

          const unsub = onSnapshot(doc(db, "users", uid), (userSnap) => {
            if (!userSnap.exists()) return;

            const userData: AppUser = {
              id: userSnap.id,
              ...(userSnap.data() as Omit<AppUser, "id">),
            };

            setMembers((prev) => {
              const exists = prev.find((m) => m.id === userData.id);
              if (exists) {
                return prev.map((m) => (m.id === userData.id ? userData : m));
              }
              return [...prev, userData];
            });
          });

          memberUnsubs.current[uid] = unsub;
        });
      }
    );

    return () => {
      unsubscribeHousehold();
      Object.values(memberUnsubs.current).forEach((u) => u());
      memberUnsubs.current = {};
      setMembers([]);
    };
  }, [householdId]);

  return members;
}
