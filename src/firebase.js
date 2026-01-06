// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCd0m6ElzxKdypa90ybEFnLZK-frxFqMJw",
  authDomain: "dak-smyvet.firebaseapp.com",
  projectId: "dak-smyvet",
  storageBucket: "dak-smyvet.firebasestorage.app",
  messagingSenderId: "494937607005",
  appId: "1:494937607005:web:22b32b1fef13694623b6b4",
  measurementId: "G-X41SLWTQKD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Persist auth
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Auth persistence set to local."))
  .catch((err) => console.error("Error setting auth persistence:", err));
