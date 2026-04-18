import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyBW8pVk_omIHrH95PqDPlnIZsI9tjkGFUI",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "finsight-d27a6.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "finsight-d27a6",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "finsight-d27a6.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "494049581436",
  appId: env.VITE_FIREBASE_APP_ID || "1:494049581436:web:cacb4ccd22e51e0e9eacf9",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-XTGP2G6M0F",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);

// exports
export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
