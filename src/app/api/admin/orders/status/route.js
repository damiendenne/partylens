import { adminDb, admin } from '@/lib/firebaseAdmin';
import { isAdminUser, requireUser, unauthorized } from '@/lib/apiAuth';

const allowedStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

export async function PATCH(request) {
  const user = await requireUser(request);
  if (!isAdminUser(user)) return unauthorized();
  const body = await request.json();
  if (!body.orderId || !allowedStatuses.includes(body.status)) return Response.json({ error: 'Statut invalide.' }, { status: 400 });
  await adminDb.collection('orders').doc(body.orderId).update({ status: body.status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return Response.json({ ok: true });
}
