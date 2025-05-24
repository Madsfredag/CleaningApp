// utils/joinHouseholdSafely.ts
import {
  getDoc,
  updateDoc,
  doc,
  setDoc,
  arrayRemove,
  arrayUnion,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Alert } from "react-native";

/**
 * Safe join logic: Confirm, leave previous household, update new one.
 */
export async function joinHouseholdSafely(
  code: string,
  userId: string
): Promise<string | null> {
  // 🔍 Find new household
  const q = query(collection(db, "households"), where("code", "==", code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const newHouseholdDoc = snapshot.docs[0];
  const newHouseholdId = newHouseholdDoc.id;

  // 🔍 Get current household from user document
  const userDocRef = doc(db, "users", userId);
  const userSnap = await getDoc(userDocRef);
  const currentHouseholdId = userSnap.exists()
    ? userSnap.data().householdId
    : null;

  // 🧠 If already in same household, do nothing
  if (currentHouseholdId === newHouseholdId) return newHouseholdId;

  // ⚠️ If already in a different household, confirm intention
  if (currentHouseholdId) {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Switch Household",
        "You're already in a household. Do you want to leave and join a new one?",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Join New", style: "destructive", onPress: () => resolve(true) },
        ]
      );
    });
    if (!confirmed) return null;

    // Remove from current household
    await updateDoc(doc(db, "households", currentHouseholdId), {
      members: arrayRemove(userId),
    });
  }

  // ✅ Join new household
  await updateDoc(newHouseholdDoc.ref, {
    members: arrayUnion(userId),
  });
  await setDoc(userDocRef, { householdId: newHouseholdId }, { merge: true });
  return newHouseholdId;
}
