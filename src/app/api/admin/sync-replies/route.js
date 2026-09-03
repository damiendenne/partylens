import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireUser, unauthorized, isAdminUser } from '@/lib/apiAuth';

export async function POST(request) {
  const user = await requireUser(request);
  if (!isAdminUser(user)) return unauthorized();
  const client = new ImapFlow({ host: process.env.OVH_IMAP_HOST, port: Number(process.env.OVH_IMAP_PORT || 993), secure: true, auth: { user: process.env.OVH_IMAP_USER, pass: process.env.OVH_IMAP_PASSWORD } });
  let count = 0;
  try { await client.connect(); const lock = await client.getMailboxLock('INBOX'); try { for await (const msg of client.fetch({ seen: false }, { envelope: true, source: true, uid: true })) { const parsed = await simpleParser(msg.source); const from = parsed.from?.value?.[0]?.address; if (!from) continue; await adminDb.collection('inboundEmails').doc(String(msg.uid)).set({ uid: msg.uid, from, subject: parsed.subject || '', text: parsed.text || '', receivedAt: parsed.date || new Date() }, { merge: true }); await client.messageFlagsAdd(msg.uid, ['\\Seen']); count++; } } finally { lock.release(); } } finally { await client.logout().catch(() => {}); }
  return Response.json({ success: true, count });
}

export async function GET(request) {
  const user = await requireUser(request); if (!isAdminUser(user)) return unauthorized();
  const from = new URL(request.url).searchParams.get('from');
  const snap = await adminDb.collection('inboundEmails').where('from', '==', from).get();
  return Response.json({ replies: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
}
