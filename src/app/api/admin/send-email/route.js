import { Resend } from 'resend';
import { requireUser, unauthorized, isAdminUser } from '@/lib/apiAuth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const user = await requireUser(request);
  if (!isAdminUser(user)) return unauthorized();
  const { recipients, subject, message } = await request.json();
  const emails = Array.isArray(recipients) ? recipients.filter((e) => /^\S+@\S+\.\S+$/.test(e)).slice(0, 100) : [];
  if (!emails.length || !subject?.trim() || !message?.trim()) return Response.json({ error: 'Destinataires, objet et message requis.' }, { status: 400 });
  const safeMessage = String(message).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]).replace(/\n/g, '<br>');
  const year = new Date().getFullYear();
  const result = await resend.emails.send({ from: 'PartyLens <contact@partylens.fr>', to: emails, subject: String(subject).slice(0, 200), html: `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto;color:#24113b">${safeMessage}<hr style="margin-top:32px;border:0;border-top:1px solid #eee"><footer style="font-size:12px;color:#777;text-align:center">PartyLens France — ${year}<br>contact@partylens.fr · 07 87 01 60 77</footer></div>` });
  return Response.json({ success: true, result });
}
