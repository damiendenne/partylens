// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_PROJECT.firebaseapp.com",
  projectId: "TON_PROJECT_ID",
  storageBucket: "TON_PROJECT.appspot.com",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID"
};

// Initialise Firebase (évite les erreurs au rechargement de Next.js)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };