// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"; // <--- Ajout pour l'authentification

const firebaseConfig = {
  apiKey: "AIzaSyCKa5VNoAl0L9mQK_Tbd0Y03_bnFrgy56g",
  authDomain: "partylens-94ad0.firebaseapp.com",
  projectId: "partylens-94ad0",
  storageBucket: "partylens-94ad0.firebasestorage.app",
  messagingSenderId: "242525466462",
  appId: "1:242525466462:web:81ddb6c99c2b3c4d76e9cf",
  measurementId: "G-FR786QQ7F4"
};

// Initialisation de Firebase (évite les bugs au rechargement de page)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Les services dont on a besoin
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app); // <--- Initialisation du service Auth

// On exporte "auth" pour l'utiliser dans Register et Login
export { db, storage, auth };