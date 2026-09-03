import { admin, adminDb } from '@/lib/firebaseAdmin';
import { requireUser, unauthorized, isAdminUser } from '@/lib/apiAuth';

export async function GET(request) {
  const user = await requireUser(request);
  if (!isAdminUser(user)) return unauthorized();
  const [usersSnap, photoSnap] = await Promise.all([
    adminDb.collection('users').get(),
    adminDb.collection('photoboothEmails').get()
  ]);
  const contacts = new Map();
  usersSnap.forEach((doc) => { const d = doc.data(); const email = d.email || d.Email || d.mail || d.eMail; if (email) contacts.set(String(email).toLowerCase(), { email: String(email), source: 'Compte inscrit' }); });
  photoSnap.forEach((doc) => { const d = doc.data(); if (d.email) contacts.set(String(d.email).toLowerCase(), { email: String(d.email), source: 'Photobooth' }); });
  return Response.json({ contacts: [...contacts.values()] });
}
