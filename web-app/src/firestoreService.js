import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Get user role
export async function getUserRole(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;
  return snap.data().role;
}

