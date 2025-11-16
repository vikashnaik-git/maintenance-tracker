import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { firebaseConfig } from "../src/firebaseConfig";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Sign Up
export const registerUser = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Login
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Logout
export const logoutUser = () => {
  return signOut(auth);
};
