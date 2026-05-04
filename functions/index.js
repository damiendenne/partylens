const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

// Ce robot s'activera tous les jours à 03h00 du matin
exports.nettoyageAutomatique = onSchedule({
  schedule: "every day 03:00",
  timeZone: "Europe/Paris",
  region: "europe-west1",
  memory: "256MiB", // Petite mémoire suffit pour ce nettoyage
}, async (event) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    console.log("Recherche des événements antérieurs au :", thirtyDaysAgo.toISOString());

    const eventsRef = db.collection("events");
    const snapshot = await eventsRef.where("createdAt", "<", thirtyDaysAgo).get();

    if (snapshot.empty) {
      console.log("Aucune soirée de plus de 30 jours trouvée.");
      return;
    }

    for (const docSnap of snapshot.docs) {
      const eventId = docSnap.id;
      
      // 1. Supprimer photos
      const photosSnap = await db.collection("events").doc(eventId).collection("photos").get();
      const batchPhotos = db.batch();
      photosSnap.forEach((p) => batchPhotos.delete(p.ref));
      await batchPhotos.commit();

      // 2. Supprimer musiques
      const musicSnap = await db.collection("events").doc(eventId).collection("musicRequests").get();
      const batchMusic = db.batch();
      musicSnap.forEach((m) => batchMusic.delete(m.ref));
      await batchMusic.commit();

      // 3. Supprimer l'événement
      await db.collection("events").doc(eventId).delete();
      console.log(`Nettoyage auto : Soirée ${eventId} supprimée.`);
    }
  } catch (error) {
    console.error("Erreur lors du nettoyage :", error);
  }
});