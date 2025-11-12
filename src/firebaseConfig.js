import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB40WG2UUalmXTLPrUC7JV_2jOpuURBtA0",
  authDomain: "maintenance-tracker-123.firebaseapp.com",
  projectId: "maintenance-tracker-123",
  storageBucket: "maintenance-tracker-123.firebasestorage.app",
  messagingSenderId: "510727229683",
  appId: "1:510727229683:web:3b87348a5ca67a71d4a786"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
