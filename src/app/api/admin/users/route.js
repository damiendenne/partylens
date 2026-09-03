import { admin } from '@/lib/firebaseAdmin';
import { requireUser, unauthorized, isAdminUser } from '@/lib/apiAuth';

export async function GET(request) {
  const user = await requireUser(request);
  if (!isAdminUser(user)) return unauthorized();
  const result = await admin.auth().listUsers(1000);
  return Response.json({ users: result.users.map((u) => ({ uid: u.uid, email: u.email || '', createdAt: u.metadata.creationTime || null, lastSignIn: u.metadata.lastSignInTime || null })) });
}
