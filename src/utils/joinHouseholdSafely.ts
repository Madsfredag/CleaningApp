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
import i18n from "../translations/i18n";

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
        i18n.t("switch_household_title"),
        i18n.t("switch_household_message"),
        [
          {
            text: i18n.t("cancel"),
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: i18n.t("join_new_household"),
            style: "destructive",
            onPress: () => resolve(true),
          },
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
