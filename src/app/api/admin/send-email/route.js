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
  const result = await resend.emails.send({ from: 'PartyLens <contact@partylens.fr>', to: emails, subject: String(subject).slice(0, 200), html: `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px;margin:auto;color:#24113b;background:#fff;border:1px solid #eee;border-radius:18px;overflow:hidden"><div style="background:linear-gradient(135deg,#24113b,#f97316);padding:28px;text-align:center"><img src="https://www.partylens.fr/logo-partylens.png" alt="PartyLens France" style="max-width:180px;max-height:70px;object-fit:contain;background:#fff;border-radius:12px;padding:8px"></div><div style="padding:32px">${safeMessage}</div><hr style="margin:0;border:0;border-top:1px solid #eee"><footer style="padding:20px;font-size:12px;color:#777;text-align:center">© ${year} PartyLens France<br>contact@partylens.fr · 07 87 01 60 77<br><a href="https://www.partylens.fr" style="color:#f97316">www.partylens.fr</a></footer></div>` });
  return Response.json({ success: true, result });
}
