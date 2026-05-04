import admin from 'firebase-admin';

if (!admin.apps.length) {
  // On nettoie la clé pour éviter l'erreur de décodage
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
    : undefined;

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("✅ Firebase Admin initialisé avec succès");
  } catch (error) {
    console.error("❌ Erreur d'initialisation Firebase Admin:", error.message);
  }
}

export const adminDb = admin.firestore();
export { admin };