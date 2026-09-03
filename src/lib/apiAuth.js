import { admin } from '@/lib/firebaseAdmin';

export async function requireUser(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export function isAdminUser(user) {
  return Boolean(user && (user.admin === true || user.email === 'damiendenne.nicolastual@outlook.fr'));
}

export function unauthorized() {
  return Response.json({ error: 'Authentification requise.' }, { status: 401 });
}
