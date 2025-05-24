// src/firestore/householdService.ts
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  getDoc,
  doc,
  query,
  where,
  arrayUnion,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * Generates a random 6-character alphanumeric code (uppercase).
 */
function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Creates a new household and assigns the current user as owner/member.
 * Also stores the householdId on the user's document.
 */
export async function createHousehold(name: string, userId: string): Promise<string> {
  const code = generateCode();
  const docRef = await addDoc(collection(db, 'households'), {
    name,
    code,
    ownerId: userId,
    members: [userId],
    createdAt: serverTimestamp(),
  });

  // Save the householdId to the user document
  await setDoc(doc(db, 'users', userId), { householdId: docRef.id }, { merge: true });

  return code; // return the code so it can be used in QR
}

/**
 * Joins a household by its 6-character code and updates the user's householdId.
 * Returns the householdId if successful, otherwise null.
 */
export async function joinHouseholdByCode(code: string, userId: string): Promise<string | null> {
  const q = query(collection(db, 'households'), where('code', '==', code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const householdDoc = snapshot.docs[0];
  const docRef = householdDoc.ref;

  await updateDoc(docRef, { members: arrayUnion(userId) });
  await setDoc(doc(db, 'users', userId), { householdId: docRef.id }, { merge: true });

  return docRef.id;
}

/**
 * Retrieves the householdId for the current user.
 */
export async function getUserHouseholdId(userId: string): Promise<string | null> {
  const docSnap = await getDoc(doc(db, 'users', userId));
  return docSnap.exists() ? docSnap.data()?.householdId ?? null : null;
}
