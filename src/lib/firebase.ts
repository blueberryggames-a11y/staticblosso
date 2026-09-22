/**
 * AniBlossom — Firebase initialisation
 * All Firebase SDK instances are exported from here.
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  getFirestore,
} from "firebase/firestore";
import {
  getDatabase,
} from "firebase/database";
import {
  getStorage,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyChDl-zM0n-bi7oD3o3cSXro1E9PXVcZJ4",
  authDomain: "aniblossom-f0d34.firebaseapp.com",
  projectId: "aniblossom-f0d34",
  storageBucket: "aniblossom-f0d34.firebasestorage.app",
  messagingSenderId: "149563551782",
  appId: "1:149563551782:web:784edc8efcf4ee2a20b6e7",
  measurementId: "G-XN8VWV9DQ1",
  databaseURL: "https://aniblossom-f0d34-default-rtdb.firebaseio.com",
};

// Avoid re-initialising when Next.js hot-reloads
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
