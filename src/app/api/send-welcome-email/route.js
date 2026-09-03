import { Resend } from 'resend';
import { requireUser, unauthorized } from '@/lib/apiAuth';
const resend = new Resend(process.env.RESEND_API_KEY);
export async function POST(request) {
  const user = await requireUser(request);
  if (!user) return unauthorized();
  const { email, name } = await request.json();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  if (user.email !== email) return Response.json({ error: 'Adresse non autorisée.' }, { status: 403 });
  const year = new Date().getFullYear();
  const safeName = String(name || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const result = await resend.emails.send({ from:'PartyLens <contact@partylens.fr>', to:[email], subject:'Bienvenue chez PartyLens !', html:`<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#24113b;background:#fff;border:1px solid #eee;border-radius:18px;overflow:hidden"><div style="background:linear-gradient(135deg,#24113b,#f97316);padding:28px;text-align:center"><img src="https://www.partylens.fr/logo-partylens.png" alt="PartyLens France" style="max-width:200px;max-height:80px;object-fit:contain;background:#fff;border-radius:12px;padding:8px"></div><div style="padding:32px;line-height:1.7"><h1 style="color:#f97316">Bienvenue${safeName ? ` ${safeName}` : ''} !</h1><p>Merci pour votre inscription chez PartyLens France.</p><p>Créez des souvenirs inoubliables avec notre photobooth, votre galerie photo live, le livre d’or numérique et nos animations interactives.</p><p>Votre espace est prêt : connectez-vous pour créer votre premier événement.</p><p style="text-align:center;margin:28px 0"><a href="https://www.partylens.fr/admin" style="display:inline-block;background:#f97316;color:#fff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:bold">Accéder à mon espace</a></p></div><hr style="margin:0;border:0;border-top:1px solid #eee"><footer style="padding:20px;font-size:12px;color:#777;text-align:center">© ${year} PartyLens France<br>contact@partylens.fr · 07 87 01 60 77<br><a href="https://www.partylens.fr" style="color:#f97316">www.partylens.fr</a></footer></div>` });
  return Response.json({ success: true, result });
}
